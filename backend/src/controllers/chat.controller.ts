import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service.js';
import { chatRequestSchema } from '@shared/validators/schemas.js';
import container from '../infrastructure/di/container.js';
import { contextLogger } from '../infrastructure/logger/index.js';
import { BadRequestError } from '../domain/errors/app-error.js';

export class ChatController {
  private chatService: ChatService;

  constructor(chatService?: ChatService) {
    this.chatService = chatService || container.resolve<ChatService>('ChatService');
  }

  handleChatRequest = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId;
    const logger = contextLogger(requestId);
    logger.info('Nueva solicitud de chat recibida');

    try {
      let chatInput = req.body;

      if (req.body.messages && !req.body.userMessage) {
        const messages = req.body.messages;
        const lastMessage = messages[messages.length - 1];
        chatInput = {
          userMessage: lastMessage?.text || lastMessage?.content || '',
          conversationHistory: messages.slice(0, -1).map((m: any) => ({
            role: m.role,
            text: m.text || m.content || '',
          })),
          userEmail: req.body.userEmail,
        };
      } else {
        // Preserve userEmail if present in original body
        chatInput = {
          ...chatInput,
          userEmail: req.body.userEmail,
        };
      }

      const validation = chatRequestSchema.safeParse(chatInput);
      if (!validation.success) {
        return res.status(400).json({
          text: 'Datos de consulta inválidos.',
          details: validation.error.format(),
        });
      }

      const chatResponse = await this.chatService.processChat(
        {
          userMessage: validation.data.userMessage,
          conversationHistory: validation.data.conversationHistory,
          userEmail: chatInput.userEmail,
        },
        requestId
      );

      return res.status(200).json(chatResponse);
    } catch (error) {
      next(error);
    }
  };
}
