import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api.routes.js';
import { supabaseClient } from './config/supabase.config.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ENV } from './config/env.config.js';
import { requestLoggerMiddleware } from './infrastructure/logger/index.js';

const app = express();

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
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
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
