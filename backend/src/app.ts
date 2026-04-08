import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/chat.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

// Valida que estén todas las variables críticas cargadas
import { ENV } from './config/env.config.js';

const app = express();

// Middlewares globales
app.use(cors({
  origin: [ENV.FRONTEND_URL, 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Registro de Rutas
app.use('/api', apiRoutes);

// Manejo Global de Errores
app.use(errorHandler);

export default app;
