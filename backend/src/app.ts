import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/chat.routes';
import { errorHandler } from './middlewares/error.middleware';

// Valida que estén todas las variables críticas cargadas
import './config/env.config';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Registro de Rutas
app.use('/api', apiRoutes);

// Manejo Global de Errores
app.use(errorHandler);

export default app;
