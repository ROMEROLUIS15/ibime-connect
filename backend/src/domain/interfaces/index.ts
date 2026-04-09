import type { KnowledgeMatch as SharedKnowledgeMatch } from '../../shared/types/domain.js';

export type KnowledgeMatch = SharedKnowledgeMatch;

export interface IEmbeddingService {
  getEmbedding(text: string, requestId?: string): Promise<number[]>;
}

export interface IKnowledgeRepository {
  matchKnowledge(queryEmbedding: number[], matchCount: number, matchThreshold: number, requestId?: string): Promise<KnowledgeMatch[]>;
}

export interface ILLMProvider {
  generateAnswer(messages: LLMMessage[], options?: { temperature?: number; maxTokens?: number }, requestId?: string): Promise<LLMResponse>;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
}
