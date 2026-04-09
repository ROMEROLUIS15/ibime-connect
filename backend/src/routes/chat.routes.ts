import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';

const router = Router();

router.post('/chat', (req, res, next) =>
  new ChatController(undefined).handleChatRequest(req, res, next)
);

export default router;
