import { Router } from 'express';
import multer from 'multer';
import { KnowledgeController } from '../controllers/knowledge.controller.js';
// Opcional: Podríamos importar un middleware de autenticación (ej. authMiddleware o apiKeyMiddleware)
// import { requireApiKey } from '../middlewares/auth.middleware.js';

const router = Router();
const knowledgeController = new KnowledgeController();

// Configuración de Multer para almacenar el archivo en la memoria RAM (no en disco)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10 MB por PDF
  }
});

// Endpoint para subir PDFs
// Idealmente esto debería estar protegido: router.post('/upload-pdf', requireApiKey, upload.single('file'), ...)
router.post(
  '/upload-pdf', 
  upload.single('file'), // 'file' es el nombre del campo en el form-data
  knowledgeController.uploadPdf
);

// Endpoint para el Webhook de n8n (Koha)
router.post(
  '/webhook/koha',
  // requireApiKey, // Recomendado protegerlo en el futuro
  knowledgeController.kohaWebhook
);

export default router;
