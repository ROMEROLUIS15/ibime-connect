import { supabaseClient } from '../../config/supabase.config.js';
import { contextLogger } from '../logger/index.js';
import type { IKnowledgeRepository, KnowledgeMatch } from '../../domain/interfaces/index.js';

export class KnowledgeRepository implements IKnowledgeRepository {
  async matchKnowledge(
    queryEmbedding: number[],
    matchCount: number = 5,
    matchThreshold: number = 0.65, // Must match RAGService.MIN_VALID_THRESHOLD
    requestId?: string
  ): Promise<KnowledgeMatch[]> {
    const logger = contextLogger(requestId);
    const startTime = Date.now();

    try {
      const { data, error } = await supabaseClient.rpc('match_knowledge', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_count: matchCount,
        match_threshold: matchThreshold,
      });

      const duration = Date.now() - startTime;

      if (error) {
        logger.error('Supabase RPC error', { error, duration });
        throw error;
      }

      const results = (data || []) as any[];
      logger.info('Knowledge matching completed', {
        duration,
        matchCount: results.length,
      });

      // NOTA: el RPC match_knowledge solo retorna id, title, content, similarity.
      // 'category' viene undefined porque la función no lo proyecta (vive en
      // knowledge_base.metadata->>'category'). Se mantiene el campo de forma
      // defensiva: si en el futuro se necesita filtrar/mostrar por categoría,
      // ampliar el RPC para retornarla (migración) en vez de leer aquí.
      return results.map((row: any) => ({
        id: row.id,
        category: row.category,
        title: row.title,
        content: row.content,
        similarity: row.similarity,
      } as KnowledgeMatch));
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to match knowledge', { error, duration });
      throw error;
    }
  }
}
