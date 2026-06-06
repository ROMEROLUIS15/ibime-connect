import { Router } from 'express';
import multer from 'multer';
import { KnowledgeController } from '../controllers/knowledge.controller.js';
import { AgentController } from '../controllers/agent.controller.js';
import { requireAdminKey } from '../middlewares/admin-auth.middleware.js';

const router = Router();
const knowledgeController = new KnowledgeController();

// Configuración de Multer para almacenar el archivo en la memoria RAM (no en disco)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10 MB por PDF
  }
});

// Endpoint para subir PDFs: unifica la ingesta de RAG a través del Curation Graph de LangGraph.
// Protegido: requiere x-admin-key (igual que /agents/curate-catalog).
router.post(
  '/upload-pdf',
  requireAdminKey,
  upload.single('file'), // 'file' es el nombre del campo en el form-data
  (req, res, next) => new AgentController(undefined).handleCurationRequest(req, res, next)
);

// Endpoint para el Webhook de n8n (Koha).
// Protegido: la automatización n8n debe enviar el header x-admin-key.
router.post(
  '/webhook/koha',
  requireAdminKey,
  knowledgeController.kohaWebhook
);

export default router;
