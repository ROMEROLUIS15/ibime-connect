import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// --- SOLUCIÓN PARA ESM ---
// En ES Modules (__dirname) no existe, debemos construirlo así:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el .env (solo para desarrollo local)
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.log('[ibime-backend] No se encontró un archivo .env físico, usando variables de entorno del sistema.');
} else {
  console.log(`[ibime-backend] Archivo .env cargado desde: ${envPath}`);
}

/**
 * Schema de variables de entorno — ÚNICA fuente de verdad.
 * El tipo `Env` se infiere de aquí, por lo que validación y tipos no pueden
 * divergir (a diferencia de un check manual + `as string`).
 *
 * - Requeridas: sin default → la app no arranca si faltan o tienen mal formato.
 * - Opcionales: `.optional()` → quedan `string | undefined` a propósito.
 * - Con default: usan el valor de desarrollo cuando la variable no está.
 *
 * Se exporta para poder probarlo sin disparar el `process.exit` del arranque.
 */
export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  SUPABASE_URL: z.string().url('SUPABASE_URL debe ser una URL válida'),
  SUPABASE_PROJECT_ID: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY es requerida'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY es requerida'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY es requerida'),
  FRONTEND_URL: z.string().url('FRONTEND_URL debe ser una URL válida').default('http://localhost:5173'),
  REDIS_URL: z.string().url('REDIS_URL debe ser una URL válida').default('redis://localhost:6379'),
  ADMIN_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Valida `process.env` contra el schema. Si algo falta o tiene mal formato,
 * reporta TODOS los problemas a la vez y aborta el arranque (process.exit(1)).
 */
function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('ERROR CRÍTICO: variables de entorno inválidas o ausentes. Verifica tu archivo .env:');
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return parsed.data;
}

export const ENV = loadEnv();
