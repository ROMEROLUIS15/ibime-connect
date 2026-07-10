import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api.routes.js';
import { supabaseClient } from './config/supabase.config.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ENV } from './config/env.config.js';
import { logger, requestLoggerMiddleware } from './infrastructure/logger/index.js';

const app = express();

// El backend corre detrás del proxy de Render (1 salto). Sin esto, `req.ip`
// sería la IP del proxy —no la del cliente— y el rate-limiting por IP dejaría de
// funcionar (todos compartirían un mismo cubo) o sería evadible vía X-Forwarded-For.
// Si en el futuro se añade otro proxy delante (p. ej. Cloudflare), súbelo a 2.
app.set('trust proxy', 1);

// Cabeceras de seguridad. API JSON-only, así que la config por defecto de helmet
// (nosniff, frameguard, HSTS, sin CSP de documento) es la adecuada.
app.use(helmet());

// Middlewares globales
// CORS: en producción solo se permite el frontend oficial. Los orígenes de
// desarrollo (localhost) se añaden únicamente fuera de producción para no
// ampliar la superficie de orígenes permitidos en el deploy real.
const allowedOrigins = [ENV.FRONTEND_URL];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:4000', 'http://127.0.0.1:4000');
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(requestLoggerMiddleware);

// NOTA (escalabilidad): estos limiters usan el store en memoria por defecto,
// correcto para un único proceso (deploy actual de 1 instancia en Render).
// TODO: si se escala a múltiples instancias, migrar a un store compartido
// (rate-limit-redis sobre el redisClient existente); de lo contrario el límite
// real se multiplica por el número de instancias. El límite que protege la cuota
// de Groq (GroqRateLimiter) ya es Redis-backed y sí es seguro entre instancias.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Demasiadas solicitudes. Por favor intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
});

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ibime-backend is running' });
});

// Health check endpoint with DB ping
app.get('/health', async (req, res) => {
  try {
    // Ping Supabase to keep it awake (using a simple RPC or query)
    const { error } = await supabaseClient.from('knowledge_base').select('id').limit(1);
    
    if (error) throw error;

    res.status(200).json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    // El detalle del error se registra server-side; nunca se expone al cliente
    // (podría filtrar internals de la conexión a la base de datos).
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Health check: base de datos inaccesible');
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Rate limiting específico para chat (aplica a ambas rutas: v1 y legacy)
app.use('/api/v1/chat', chatLimiter);
app.use('/api/chat', chatLimiter);

// Rate limiting general para todas las rutas de API
app.use('/api', apiLimiter, apiRoutes);

app.use(errorHandler);

export default app;
