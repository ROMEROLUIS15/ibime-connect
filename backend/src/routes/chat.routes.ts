import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';

const router = Router();

router.post('/chat', ChatController.handleChatRequest);

export default router;
