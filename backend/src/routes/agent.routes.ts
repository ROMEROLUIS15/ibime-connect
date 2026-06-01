import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { AgentController } from '../controllers/agent.controller.js';

const router = Router();

// Configuración de Multer para almacenar el archivo en memoria RAM
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10 MB por PDF
  }
});

// Limitador de tasa específico para el sandbox de agentes (5 consultas por minuto por IP)
const curationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Demasiadas solicitudes de curación de catálogo. Por favor intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => process.env.NODE_ENV === 'test',
});

// Endpoint del sandbox de LangGraph para curación de documentos (acepta tanto PDF en form-data como JSON directo)
router.post(
  '/agents/curate-catalog',
  curationLimiter,
  upload.single('file'), // 'file' es el nombre del campo para el archivo en form-data
  (req, res, next) => new AgentController(undefined).handleCurationRequest(req, res, next)
);

export default router;
