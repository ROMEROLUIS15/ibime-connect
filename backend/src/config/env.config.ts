import dotenv from 'dotenv';
import path from 'path';

// Cargar el .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: process.env.PORT || 3000,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_PROJECT_ID: process.env.SUPABASE_PROJECT_ID,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

// Validación para que la app no arranque si faltan variables críticas
const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY', 'GROQ_API_KEY'];

for (const key of requiredEnvs) {
  if (!ENV[key as keyof typeof ENV]) {
    console.error(`ERROR CRÍTICO: Falta la variable de entorno ${key}. Verifica tu archivo .env.`);
    process.exit(1);
  }
}
