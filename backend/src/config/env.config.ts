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
  // Modelo de inferencia en GroqCloud. `llama-3.1-8b-instant` quedó deprecado y
  // deja de servirse el 2026-08-16; el reemplazo recomendado por Groq es GPT OSS 20B.
  // Se puede sobreescribir por entorno sin tocar código (p. ej. openai/gpt-oss-120b).
  GROQ_MODEL: z.string().min(1, 'GROQ_MODEL no puede estar vacío').default('openai/gpt-oss-20b'),

  // Límites REALES del plan de Groq para GROQ_MODEL (no los umbrales operativos).
  // Defaults = free tier de openai/gpt-oss-20b. Verifica los tuyos en la consola
  // de Groq (Settings → Limits) si tienes un plan distinto.
  GROQ_TPM_LIMIT: z.coerce.number().int().positive().default(8_000),
  GROQ_RPM_LIMIT: z.coerce.number().int().positive().default(30),
  GROQ_RPD_LIMIT: z.coerce.number().int().positive().default(1_000),
  GROQ_TPD_LIMIT: z.coerce.number().int().positive().default(200_000),
  /**
   * Fracción del límite real a la que opera GroqRateLimiter (0 < x <= 1).
   * Solo afecta a las ventanas por minuto (TPM/RPM), donde el colchón absorbe
   * ráfagas. Las cuotas diarias (RPD/TPD) se consumen íntegras.
   */
  GROQ_SAFETY_MARGIN: z.coerce.number().positive().max(1).default(0.8),
  FRONTEND_URL: z.string().url('FRONTEND_URL debe ser una URL válida').default('http://localhost:5173'),
  REDIS_URL: z.string().url('REDIS_URL debe ser una URL válida').default('redis://localhost:6379'),
  ADMIN_SECRET: z.string().optional(),

  // Observability (Sentry) — opcional, graceful degradation si no está.
  // Sin DSN, la captura de errores es no-op y el backend funciona idéntico.
  SENTRY_DSN: z.string().url('SENTRY_DSN debe ser una URL válida').optional(),

  // Observability (LangSmith) — opcional, graceful degradation si no está
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_TRACING: z
    .string()
    .optional()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),
  LANGSMITH_PROJECT: z.string().optional().default('ibime-connect'),
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
