import { Request, Response } from 'express';
import { KnowledgeIngestionService } from '../services/knowledge-ingestion.service.js';
import { contextLogger } from '../infrastructure/logger/index.js';

/**
 * Máximo de ítems por petición al webhook de Koha. Cada ítem nuevo o modificado
 * se embebe y se escribe en serie (con pausa por la cuota de Gemini), así que el
 * tamaño del lote acota cuánto tiempo queda abierta la petición HTTP.
 */
export const MAX_KOHA_ITEMS_PER_REQUEST = 50;

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

      if (items.length > MAX_KOHA_ITEMS_PER_REQUEST) {
        logger.warn(`Webhook Koha rechazado: ${items.length} elementos (máximo ${MAX_KOHA_ITEMS_PER_REQUEST} por petición).`);
        return res.status(413).json({
          error: `Se aceptan como máximo ${MAX_KOHA_ITEMS_PER_REQUEST} elementos por petición; envía el catálogo en lotes.`,
          registrosRecibidos: items.length,
          maxItems: MAX_KOHA_ITEMS_PER_REQUEST,
        });
      }

      logger.info(`Recibida petición Webhook Koha con ${items.length} elementos.`);

      // Ingesta idempotente: upsert por koha_id + hash de contenido (evita
      // duplicados en cada sync y re-embeddings innecesarios).
      // n8n debe enviar un identificador estable por ítem (biblionumber/id/biblio_id).
      const requestId = req.headers['x-request-id'] as string;
      const result = await this.ingestionService.upsertKohaItems(items, 'catalogo', requestId);

      return res.status(200).json({
        message: 'Webhook Koha procesado.',
        registrosRecibidos: items.length,
        resultado: result
      });

    } catch (error: any) {
      logger.error('Error procesando webhook de Koha', { error: error.message });
      return res.status(500).json({ error: 'Ocurrió un error procesando el webhook.' });
    }
  };
}
