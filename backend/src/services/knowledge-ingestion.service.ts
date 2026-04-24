import { supabaseClient } from '../config/supabase.config.js';
import { contextLogger } from '../infrastructure/logger/index.js';
import { EmbeddingService } from './embedding.service.js';
import type { DocumentChunk } from './document-processor.service.js';

export class KnowledgeIngestionService {
  private embeddingService = new EmbeddingService();

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
