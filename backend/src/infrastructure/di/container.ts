import 'reflect-metadata';
import { container } from 'tsyringe';
import { EmbeddingService } from '../../services/embedding.service.js';
import { KnowledgeRepository } from '../repositories/knowledge.repository.js';
import { GroqProvider } from '../providers/groq.provider.js';
import { RAGService } from '../../services/rag.service.js';
import { ChatService } from '../../services/chat.service.js';
import type { IEmbeddingService, IKnowledgeRepository, ILLMProvider } from '../../domain/interfaces/index.js';

// Note: tsyringe provides a global 'container' instance, 
// but the user's snippet used 'new Container()'. 
// However, the common pattern with tsyringe is 'container' from 'tsyringe'.
// I will use 'container' to align with standard tsyringe usage and ensure decorators work.

container.registerSingleton<IEmbeddingService>('IEmbeddingService', EmbeddingService);
container.registerSingleton<IKnowledgeRepository>('IKnowledgeRepository', KnowledgeRepository);
container.registerSingleton<ILLMProvider>('ILLMProvider', GroqProvider);

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
      c.resolve<RAGService>('RAGService')
    );
  },
});

export default container;
