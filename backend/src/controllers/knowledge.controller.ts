import { Request, Response } from 'express';
import { DocumentProcessorService } from '../services/document-processor.service.js';
import { KnowledgeIngestionService } from '../services/knowledge-ingestion.service.js';
import { contextLogger } from '../infrastructure/logger/index.js';

export class KnowledgeController {
  private documentProcessor = new DocumentProcessorService();
  private ingestionService = new KnowledgeIngestionService();

  /**
   * Endpoint: POST /api/knowledge/upload-pdf
   * Recibe un PDF en formato multipart/form-data, extrae el texto, hace chunking y lo ingesta.
   */
  uploadPdf = async (req: Request, res: Response) => {
    const logger = contextLogger(req.headers['x-request-id'] as string);
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se encontró ningún archivo PDF en la petición.' });
      }

      // Parámetros opcionales del body
      const category = req.body.category || 'documento';
      const documentTitle = req.body.title || req.file.originalname || 'Documento sin título';

      logger.info(`Recibida petición para procesar PDF: ${documentTitle}`);

      // 1. Extraer texto del PDF (en memoria)
      const text = await this.documentProcessor.extractTextFromPdf(req.file.buffer);

      // 2. Dividir el texto en chunks
      const chunks = this.documentProcessor.chunkText(text, { source: req.file.originalname });

      if (chunks.length === 0) {
         return res.status(400).json({ error: 'No se pudo extraer texto válido del PDF.' });
      }

      // 3. Vectorizar e Ingestar en Supabase
      // Lo enviamos a procesar en background para no bloquear la respuesta HTTP si es muy largo
      // O podemos esperar la respuesta. Elegiremos esperar para dar feedback síncrono.
      const result = await this.ingestionService.ingestChunks(chunks, category, documentTitle);

      return res.status(200).json({
        message: 'Documento procesado exitosamente.',
        title: documentTitle,
        chunksGenerados: chunks.length,
        resultadosIngesta: result
      });

    } catch (error: any) {
      logger.error('Error procesando upload de PDF', { error: error.message });
      return res.status(500).json({ error: 'Ocurrió un error procesando el documento.', details: error.message });
    }
  };

  /**
   * Endpoint: POST /api/knowledge/webhook/koha
   * Recibe un JSON array desde n8n con la data del catálogo.
   */
  kohaWebhook = async (req: Request, res: Response) => {
    const logger = contextLogger(req.headers['x-request-id'] as string);

    try {
      const items = req.body; // Esperamos un arreglo de objetos de n8n
      
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'El cuerpo de la petición debe ser un arreglo JSON.' });
      }

      logger.info(`Recibida petición Webhook Koha con ${items.length} elementos.`);

      // Convertimos el JSON crudo en "chunks" compatibles con nuestro sistema
      // Asumiendo que n8n envía: [{ titulo: "Libro 1", autor: "Autor 1", resumen: "..." }]
      const chunks = items.map((item, index) => {
        // Concatenamos las propiedades importantes en un solo string
        const content = Object.entries(item)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');

        return {
          content: `[Catálogo Koha]\n${content}`,
          metadata: { source: 'koha_webhook', itemIndex: index }
        };
      });

      // Procesamos la ingesta
      const result = await this.ingestionService.ingestChunks(chunks, 'catalogo', 'Actualización Koha');

      return res.status(200).json({
        message: 'Webhook Koha procesado.',
        registrosRecibidos: items.length,
        resultadosIngesta: result
      });

    } catch (error: any) {
      logger.error('Error procesando webhook de Koha', { error: error.message });
      return res.status(500).json({ error: 'Ocurrió un error procesando el webhook.' });
    }
  };
}
