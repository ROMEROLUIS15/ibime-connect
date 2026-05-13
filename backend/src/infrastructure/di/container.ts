import 'reflect-metadata';
import { container } from 'tsyringe';
import { EmbeddingService } from '../../services/embedding.service.js';
import { KnowledgeRepository } from '../repositories/knowledge.repository.js';
import { GroqProvider } from '../providers/groq.provider.js';
import { RAGService } from '../../services/rag.service.js';
import { ChatService } from '../../services/chat.service.js';
import { SessionMemoryService } from '../../services/session-memory.service.js';
import { SentimentAnalyzerService } from '../../services/sentiment-analyzer.service.js';
import type { IEmbeddingService, IKnowledgeRepository, ILLMProvider } from '../../domain/interfaces/index.js';

container.registerSingleton<IEmbeddingService>('IEmbeddingService', EmbeddingService);
container.registerSingleton<IKnowledgeRepository>('IKnowledgeRepository', KnowledgeRepository);
container.registerSingleton<ILLMProvider>('ILLMProvider', GroqProvider);
container.registerSingleton<SessionMemoryService>('SessionMemoryService', SessionMemoryService);
container.registerSingleton<SentimentAnalyzerService>('SentimentAnalyzerService', SentimentAnalyzerService);

container.register('RAGService', {
  useFactory: (c) => {
    return new RAGService(
      c.resolve<IEmbeddingService>('IEmbeddingService'),
      c.resolve<IKnowledgeRepository>('IKnowledgeRepository')
    );
  },
});

container.register('ChatService', {
  useFactory: (c) => {
    return new ChatService(
      c.resolve<ILLMProvider>('ILLMProvider'),
      c.resolve<RAGService>('RAGService'),
      c.resolve<SessionMemoryService>('SessionMemoryService'),
      c.resolve<SentimentAnalyzerService>('SentimentAnalyzerService')
    );
  },
});

export default container;
