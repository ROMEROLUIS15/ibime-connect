import { Request, Response } from 'express';
import { KnowledgeIngestionService } from '../services/knowledge-ingestion.service.js';
import { contextLogger } from '../infrastructure/logger/index.js';

export class KnowledgeController {
  private ingestionService = new KnowledgeIngestionService();

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
