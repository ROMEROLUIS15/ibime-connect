import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ENV } from './config/env.config.js';
import { requestLoggerMiddleware } from './infrastructure/logger/index.js';

const app = express();

// Middlewares globales
app.use(cors({
  origin: [ENV.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:4000', 'http://127.0.0.1:4000'],
  credentials: true,
}));

app.use(requestLoggerMiddleware);

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

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ibime-backend is running' });
});

// Rate limiting específico para chat (aplica a ambas rutas: v1 y legacy)
app.use('/api/v1/chat', chatLimiter);
app.use('/api/chat', chatLimiter);

// Rate limiting general para todas las rutas de API
app.use('/api', apiLimiter, apiRoutes);

app.use(errorHandler);

export default app;
