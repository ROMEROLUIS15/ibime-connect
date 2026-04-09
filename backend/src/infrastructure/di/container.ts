import 'reflect-metadata';
import { container } from 'tsyringe';
import { EmbeddingService } from '../../services/embedding.service.js';
import { KnowledgeRepository } from '../repositories/knowledge.repository.js';
import { GroqProvider } from '../providers/groq.provider.js';
import { RAGService } from '../../services/rag.service.js';
import { ChatService } from '../../services/chat.service.js';
import { ToolRegistry } from '../../services/tools.service.js';
import { CheckRegistrationTool } from '../../services/tools/check_registration.tool.js';
import type { IEmbeddingService, IKnowledgeRepository, ILLMProvider } from '../../domain/interfaces/index.js';

container.registerSingleton<IEmbeddingService>('IEmbeddingService', EmbeddingService);
container.registerSingleton<IKnowledgeRepository>('IKnowledgeRepository', KnowledgeRepository);
container.registerSingleton<ILLMProvider>('ILLMProvider', GroqProvider);

container.registerSingleton<ToolRegistry>('ToolRegistry', ToolRegistry);

const registry = container.resolve<ToolRegistry>('ToolRegistry');
registry.registerTool(new CheckRegistrationTool());

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
      c.resolve<ToolRegistry>('ToolRegistry')
    );
  },
});

export default container;
