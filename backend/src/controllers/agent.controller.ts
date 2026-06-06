import { Request, Response, NextFunction } from 'express';
import container from '../infrastructure/di/container.js';
import { CurationGraph } from '../modules/agents/curation-graph.js';
import { DocumentProcessorService, DocumentChunk } from '../services/document-processor.service.js';
import { KnowledgeIngestionService } from '../services/knowledge-ingestion.service.js';
import { contextLogger } from '../infrastructure/logger/index.js';
import { BadRequestError } from '../domain/errors/app-error.js';

export class AgentController {
  private curationGraph: CurationGraph;
  private documentProcessor = new DocumentProcessorService();
  private ingestionService = new KnowledgeIngestionService();

  constructor(curationGraph?: CurationGraph) {
    // Resolve using class token directly
    this.curationGraph = curationGraph || container.resolve<CurationGraph>(CurationGraph);
  }

  handleCurationRequest = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId;
    const logger = contextLogger(requestId);
    logger.info('Nueva solicitud de curación de catálogo recibida');

    try {
      let text = '';
      let documentTitle = 'Documento de Catálogo';

      // ── Caso A: Carga de Archivo PDF (multipart/form-data) ────────────────
      if (req.file) {
        documentTitle = req.body.title || req.file.originalname || 'Documento sin título';
        logger.info(`Procesando archivo PDF cargado para curación: ${documentTitle}`);
        text = await this.documentProcessor.extractTextFromPdf(req.file.buffer, requestId);
      } 
      // ── Caso B: Cuerpo JSON de Texto Directo ──────────────────────────────
      else {
        text = req.body.text;
        documentTitle = req.body.title || 'Texto Manual';
      }

      if (!text || text.trim() === '') {
        if (req.file) {
          throw new BadRequestError('No se pudo extraer texto válido del PDF.');
        }
        throw new BadRequestError('Debe proveer el texto del documento a analizar en el cuerpo (text).');
      }

      // ── 1. Ejecutar el Grafo de Curación de LangGraph ──────────────────────
      const curationResult = await this.curationGraph.curate(text, requestId);

      let ingestionResult = null;

      // ── 2. Ingesta Automática en Supabase si fue Aprobado ──────────────────
      const shouldIngest = req.file || req.body.ingest === true;
      if (curationResult.approved && shouldIngest && curationResult.extractedItems?.length > 0) {
        logger.info('Curación aprobada. Iniciando ingesta en Supabase (knowledge_base)...');
        
        const category = req.body.category || 'catalogo';
        
        // Convertimos los ítems estructurados en chunks de texto para ingesta y vectorización
        const chunks: DocumentChunk[] = curationResult.extractedItems.map((item, idx) => ({
          content: `Elemento: ${item.title}\nCategoría: ${item.category}\nDescripción: ${item.content}\nDetalles clave: ${item.keyDetails}`,
          metadata: {
            title: item.title,
            category: item.category,
            source: 'langgraph_curator',
            originalIndex: idx
          }
        }));

        ingestionResult = await this.ingestionService.ingestChunks(
          chunks,
          category,
          documentTitle,
          requestId
        );
      }

      const responseBody: any = {
        success: curationResult.approved,
        iterations: curationResult.iterations,
        conflicts: curationResult.conflicts,
        items: curationResult.extractedItems,
      };

      if (ingestionResult !== null) {
        responseBody.ingestion = ingestionResult;
      }

      return res.status(200).json(responseBody);
    } catch (error) {
      next(error);
    }
  };
}
