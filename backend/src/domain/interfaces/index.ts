import type { KnowledgeMatch as SharedKnowledgeMatch } from '../../shared/types/domain.js';

export type KnowledgeMatch = SharedKnowledgeMatch;

export interface IEmbeddingService {
  getEmbedding(text: string, requestId?: string): Promise<number[]>;
}

export interface IKnowledgeRepository {
  matchKnowledge(queryEmbedding: number[], matchCount: number, matchThreshold: number, requestId?: string): Promise<KnowledgeMatch[]>;
}

export interface ILLMProvider {
  generateAnswer(
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number; tools?: ITool[] },
    requestId?: string
  ): Promise<LLMResponse>;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;       // Used for role=tool
  tool_call_id?: string; // Used for role=tool
  tool_calls?: {       // Used for role=assistant
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string; // JSON string
    };
  }[];
}

export interface LLMResponse {
  content: string | null;
  tokensUsed: number;
  model: string;
  toolCalls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

export interface ITool {
  name: string;
  description: string;
  parameters: any; // JSON Schema for parameters
  execute(args: any): Promise<any>;
}
