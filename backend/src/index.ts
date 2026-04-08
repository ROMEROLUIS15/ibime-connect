import app from './app.js';
import { ENV } from './config/env.config.js';

const PORT = ENV.PORT;

app.listen(PORT, () => {
  console.log(`[ibime-backend] Servidor corriendo en puerto ${PORT}`);
  console.log(`[ibime-backend] RAG Chat endpoint disponible en: http://localhost:${PORT}/api/chat`);
});
