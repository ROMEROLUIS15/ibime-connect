import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/chat.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

// Valida que estén todas las variables críticas cargadas
import { ENV } from './config/env.config.js';

const app = express();

// Middlewares globales
app.use(cors({
  origin: [
    ENV.FRONTEND_URL, 
    'http://localhost:5173', 
    'http://localhost:4000',
    'http://127.0.0.1:4000'
  ],
  credentials: true
}));

// Logger de peticiones básico
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// Registro de Rutas
// Ruta de salud para Render
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ibime-backend is running' });
});

app.use('/api', apiRoutes);

// Manejo Global de Errores
app.use(errorHandler);

export default app;
