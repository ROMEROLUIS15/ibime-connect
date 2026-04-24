import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createHash, timingSafeEqual } from 'crypto';
import { ChatController } from '../controllers/chat.controller.js';
import { ContactController } from '../controllers/contact.controller.js';
import { RegistrationController } from '../controllers/registration.controller.js';
import { CacheService } from '../infrastructure/cache/cache.service.js';
import { ENV } from '../config/env.config.js';
import { logger } from '../infrastructure/logger/index.js';
import knowledgeRoutes from './knowledge.routes.js';

const router = Router();

// ── Chat rate limiter: 6 messages/minute per IP ───────────────────────────
// Protects the Groq free-tier (30 RPM total). A human typically sends 1-2
// messages per minute, so 6 is generous while blocking runaway clients.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  message: { error: 'Demasiados mensajes. Por favor espera un momento antes de continuar.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => process.env.NODE_ENV === 'test',
});

// V1 Routes
router.post('/v1/chat', chatLimiter, (req, res, next) =>
  new ChatController().handleChatRequest(req, res, next)
);

router.post('/v1/contact', (req, res, next) =>
  new ContactController().handleSubmission(req, res, next)
);

router.post('/v1/registrations', (req, res, next) =>
  new RegistrationController().handleRegistration(req, res, next)
);

router.use('/v1/knowledge', knowledgeRoutes);

// Backwards compatibility (Legacy routes)
router.post('/chat', chatLimiter, (req, res, next) =>
  new ChatController().handleChatRequest(req, res, next)
);

router.post('/contact', (req, res, next) =>
  new ContactController().handleSubmission(req, res, next)
);

router.post('/registrations', (req, res, next) =>
  new RegistrationController().handleRegistration(req, res, next)
);

router.use('/knowledge', knowledgeRoutes);

// Rate limiter for admin endpoints (5 requests per minute)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos. Por favor intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin endpoint: flush cache (secure)
router.get('/admin/flush-cache', adminLimiter, async (req, res) => {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey || !ENV.ADMIN_SECRET) {
    logger.warn({ hasAdminKey: !!adminKey, hasAdminSecret: !!ENV.ADMIN_SECRET }, 'Intento de acceso al flush cache sin credenciales válidas');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Timing-safe comparison usando hashes SHA-256
  const providedHash = createHash('sha256').update(String(adminKey)).digest();
  const expectedHash = createHash('sha256').update(ENV.ADMIN_SECRET).digest();

  if (!timingSafeEqual(providedHash, expectedHash)) {
    logger.warn({ ip: req.ip }, 'Intento no autorizado de flush cache');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const cache = new CacheService();
    await cache.clear();
    logger.info('Cache flushed por admin');
    return res.json({ success: true, message: 'Cache flushed' });
  } catch (err) {
    logger.error({ error: (err as Error).message }, 'Error al flush cache');
    return res.status(500).json({ error: 'Failed to flush cache' });
  }
});

export default router;
