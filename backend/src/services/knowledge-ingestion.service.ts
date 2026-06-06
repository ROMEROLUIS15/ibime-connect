import { createHash } from 'crypto';
import { supabaseClient } from '../config/supabase.config.js';
import { contextLogger } from '../infrastructure/logger/index.js';
import { EmbeddingService } from './embedding.service.js';
import type { DocumentChunk } from './document-processor.service.js';

export interface KohaUpsertResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

export class KnowledgeIngestionService {
  private embeddingService = new EmbeddingService();

  /**
   * Ingesta idempotente de ítems del catálogo de Koha (vía webhook n8n).
   *
   * Para cada ítem:
   *  - Deriva un ID estable (biblionumber/id/biblio_id; si falta, hash del ítem).
   *  - Calcula un hash del contenido y lo compara con el almacenado:
   *      • sin cambios  -> se omite (NO re-embebe, ahorra cuota de Gemini)
   *      • cambió       -> re-embebe y actualiza la fila existente
   *      • no existe    -> embebe e inserta
   * Esto evita duplicados en cada sync y re-embeddings innecesarios.
   */
  async upsertKohaItems(
    items: Array<Record<string, unknown>>,
    category = 'catalogo',
    requestId?: string
  ): Promise<KohaUpsertResult> {
    const logger = contextLogger(requestId);
    logger.info(`Iniciando upsert de ${items.length} ítems de Koha`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of items) {
      try {
        const externalId =
          String(item.biblionumber ?? item.id ?? item.biblio_id ?? '').trim() ||
          createHash('sha256').update(JSON.stringify(item)).digest('hex').slice(0, 24);

        const title = String(item.titulo ?? item.title ?? `Koha #${externalId}`).trim();
        const content =
          '[Catálogo Koha]\n' +
          Object.entries(item)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        const contentHash = createHash('sha256').update(content).digest('hex');

        // Buscar fila existente por su koha_id (clave estable en metadata).
        const { data: existing, error: selError } = await supabaseClient
          .from('knowledge_base')
          .select('id, metadata')
          .eq('metadata->>koha_id', externalId)
          .limit(1);

        if (selError) throw selError;

        const row = existing?.[0] as { id: number; metadata?: { content_hash?: string } } | undefined;

        // Sin cambios -> no re-embeber.
        if (row && row.metadata?.content_hash === contentHash) {
          skipped++;
          continue;
        }

        const embedding = await this.embeddingService.getEmbedding(content, requestId);
        const embeddingString = `[${embedding.join(',')}]`;
        const metadata = {
          source: 'koha_webhook',
          koha_id: externalId,
          content_hash: contentHash,
          category,
        };

        if (row) {
          const { error } = await supabaseClient
            .from('knowledge_base')
            .update({ title, content, embedding: embeddingString, metadata })
            .eq('id', row.id);
          if (error) throw error;
          updated++;
        } else {
          const { error } = await supabaseClient
            .from('knowledge_base')
            .insert({ title, content, embedding: embeddingString, metadata });
          if (error) throw error;
          inserted++;
        }

        // Pausa para respetar la cuota del free-tier de embeddings.
        await new Promise((resolve) => setTimeout(resolve, 400));
      } catch (err) {
        logger.error('Error en upsert de ítem de Koha', { error: (err as Error).message });
        errors++;
      }
    }

    logger.info('Upsert de Koha finalizado', { inserted, updated, skipped, errors });
    return { inserted, updated, skipped, errors };
  }

  /**
   * Recibe un array de chunks, obtiene sus vectores y los guarda en Supabase.
   */
  async ingestChunks(
    chunks: DocumentChunk[], 
    category: string, 
    documentTitle: string,
    requestId?: string
  ): Promise<{ success: number; errors: number }> {
    const logger = contextLogger(requestId);
    logger.info(`Iniciando ingesta de ${chunks.length} chunks para el documento: ${documentTitle}`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkTitle = `${documentTitle} (Parte ${i + 1})`;

      try {
        // 1. Obtener el vector de Gemini
        const embedding = await this.embeddingService.getEmbedding(chunk.content, requestId);
        const embeddingString = `[${embedding.join(',')}]`;

        // 2. Guardar en Supabase (tabla real: knowledge_base)
        const { error } = await supabaseClient
          .from('knowledge_base')
          .insert({
            title: chunkTitle,
            content: chunk.content,
            embedding: embeddingString,
            metadata: { 
              ...chunk.metadata,
              category: category 
            }
          });

        if (error) {
          logger.error(`Error de BD guardando chunk ${i + 1} de ${documentTitle}`, { error });
          errorCount++;
        } else {
          successCount++;
        }

        // 3. Rate limiting protection: 500ms entre llamadas a Gemini
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err: any) {
        logger.error(`Error procesando el chunk ${i + 1} de ${documentTitle}`, { error: err.message });
        errorCount++;
      }
    }

    logger.info(`Ingesta finalizada para ${documentTitle}`, { successCount, errorCount });
    return { success: successCount, errors: errorCount };
  }
}
