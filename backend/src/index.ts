import app from './app.js';
import { ENV } from './config/env.config.js';
import { connectRedis } from './infrastructure/cache/redis.js';
import { initSentry } from './infrastructure/observability/sentry.js';

const PORT = Number(ENV.PORT);

async function startServer() {
  // Inicializar Sentry lo antes posible (no-op si no hay SENTRY_DSN)
  initSentry();

  // Conectar a Redis antes de arrancar
  await connectRedis();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ibime-backend] Servidor corriendo en puerto ${PORT}`);
    console.log(`[ibime-backend] Health check disponible en: http://0.0.0.0:${PORT}/`);
    console.log(`[ibime-backend] Servidor listo para recibir peticiones externas.`);
  });
}

startServer();
