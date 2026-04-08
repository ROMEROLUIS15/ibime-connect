import app from './app.js';
import { ENV } from './config/env.config.js';

// Render nos da el puerto en ENV.PORT (que es 10000). 
// Lo convertimos a número para evitar errores de tipo.
const PORT = Number(ENV.PORT);

// Agregamos '0.0.0.0' para que Render pueda ver el servidor desde afuera
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ibime-backend] Servidor corriendo en puerto ${PORT}`);
  console.log(`[ibime-backend] Health check disponible en: http://0.0.0.0:${PORT}/`);
  console.log(`[ibime-backend] Servidor listo para recibir peticiones externas.`);
});
