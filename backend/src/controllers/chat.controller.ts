import { Request, Response, NextFunction } from 'express';
import { ChatService, ChatMessage } from '../services/chat.service.js';

export class ChatController {
  /**
   * Endpoint POST /api/chat
   */
  static async handleChatRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { messages } = req.body as { messages: ChatMessage[] };

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Se requiere un arreglo de mensajes." });
      }

      // El Service contiene toda la lógica pesada de comunicarse con Groq y Supabase RAG
      const responseText = await ChatService.processChat(messages);

      return res.status(200).json({ text: responseText });

    } catch (error) {
      // Pasamos el error al middleware global de errores
      next(error);
    }
  }
}
