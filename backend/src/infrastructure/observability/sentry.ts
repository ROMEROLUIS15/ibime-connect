/**
 * Sentry — captura de errores y alertas de producción.
 *
 * Gated por `SENTRY_DSN`: si no está configurado, todo es un no-op (mismo patrón
 * de degradación elegante que Redis/LangSmith). Así el backend arranca y funciona
 * idéntico sin la variable, y en local no se envía nada.
 *
 * Captura MANUAL (no auto-instrumentación de Express) para controlar exactamente
 * qué se reporta y no filtrar PII: solo errores 500 reales y alertas operativas
 * (cuota de Groq agotada). Nunca se envían correos ni cuerpos de mensajes.
 */
import * as Sentry from '@sentry/node';
import { ENV } from '../../config/env.config.js';
import { logger } from '../logger/index.js';

let enabled = false;

export function initSentry(): void {
  if (!ENV.SENTRY_DSN) {
    logger.info('Sentry deshabilitado (SENTRY_DSN no configurado) — captura en modo no-op');
    return;
  }

  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Solo errores: sin performance tracing (evita coste y ruido en free tier).
    tracesSampleRate: 0,
    // Nunca adjuntar PII automáticamente (IP, cookies, etc.).
    sendDefaultPii: false,
  });

  enabled = true;
  logger.info({ environment: process.env.NODE_ENV || 'development' }, 'Sentry inicializado');
}

export function isSentryEnabled(): boolean {
  return enabled;
}

/**
 * Reporta una excepción. No-op si Sentry está deshabilitado.
 * `context` debe contener SOLO metadatos seguros (requestId, path, method) —
 * nunca PII (correos, teléfonos, cuerpos de mensajes).
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!enabled) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

/**
 * Reporta una alerta operativa (nivel warning). No-op si Sentry está deshabilitado.
 * Pensado para condiciones que requieren atención pero no son excepciones, como
 * el agotamiento de la cuota diaria de Groq.
 */
export function captureAlert(message: string, context?: Record<string, unknown>): void {
  if (!enabled) return;
  Sentry.captureMessage(message, { level: 'warning', extra: context });
}
