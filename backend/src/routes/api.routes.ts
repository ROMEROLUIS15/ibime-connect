import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { ContactController } from '../controllers/contact.controller.js';
import { RegistrationController } from '../controllers/registration.controller.js';
import { CacheService } from '../infrastructure/cache/cache.service.js';

const router = Router();

// V1 Routes
router.post('/v1/chat', (req, res, next) =>
  new ChatController(undefined).handleChatRequest(req, res, next)
);

router.post('/v1/contact', (req, res, next) =>
  new ContactController(undefined).handleSubmission(req, res, next)
);

router.post('/v1/registrations', (req, res, next) =>
  new RegistrationController(undefined).handleRegistration(req, res, next)
);

// Backwards compatibility (Legacy routes)
router.post('/chat', (req, res, next) =>
  new ChatController(undefined).handleChatRequest(req, res, next)
);

router.post('/contact', (req, res, next) =>
  new ContactController(undefined).handleSubmission(req, res, next)
);

router.post('/registrations', (req, res, next) =>
  new RegistrationController(undefined).handleRegistration(req, res, next)
);

// Temporal: limpiar caché Redis (solo uso interno/dev)
router.get('/admin/flush-cache', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'ibime-flush-2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const cache = new CacheService();
  await cache.clear();
  return res.json({ success: true, message: 'Cache flushed' });
});

export default router;
