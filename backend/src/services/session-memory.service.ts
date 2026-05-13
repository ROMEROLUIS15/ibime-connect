/**
 * SessionMemoryService — Capa de memoria de sesión basada en Redis.
 *
 * Responsabilidad única (SRP): almacenar y recuperar contexto de conversación
 * entre turnos, usando Redis como backend persistente con TTL configurable.
 *
 * Diseño para Fase 2:
 *   - Inyectable via tsyringe (@injectable / @singleton)
 *   - Non-blocking: todos los métodos tienen fallback silencioso si Redis no está disponible
 *   - El sessionId debe ser generado por el cliente (frontend) como UUID estable
 *     por conversación, NO el requestId (que cambia cada petición).
 *
 * Uso previsto en ChatOrchestrator:
 *   const ctx = await sessionMemory.getSessionContext(sessionId);
 *   // ctx.firstEmail → fuente autoritativa para el Privacy Gate
 *   // ctx.textSentiment → pasa al análisis de sentimiento del turno actual
 *
 * Integración con el Privacy Gate (Fase 2):
 *   El Privacy Gate debe consultar PRIMERO sessionMemory (fuente del servidor)
 *   y DESPUÉS conversationHistory del cliente. El email del servidor siempre gana.
 */

import { injectable, singleton } from 'tsyringe';
import { redisClient } from '../infrastructure/cache/redis.js';
import { logger } from '../infrastructure/logger/index.js';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface SessionContext {
  /** Primer email validado que el usuario proporcionó en esta sesión. */
  firstEmail?: string;
  /** Nombre del usuario si fue mencionado (para personalización futura). */
  userName?: string;
  /**
   * Resultado del análisis de sentimiento del último turno.
   * Valores posibles: 'positive' | 'neutral' | 'frustrated' | 'angry'
   * Reservado para la capa de sentimiento de Fase 2.
   */
  textSentiment?: string;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Prefijo de clave Redis para aislar sesiones de chat de otras claves. */
const KEY_PREFIX = 'ibime:session:';

/** TTL de sesión: 30 minutos de inactividad borran el contexto automáticamente. */
const SESSION_TTL_SECONDS = 60 * 30;

// ─── Interfaz pública ────────────────────────────────────────────────────────

export interface ISessionMemoryService {
  /**
   * Persiste el contexto de sesión en Redis.
   * Si Redis no está disponible, falla silenciosamente (no bloquea el flujo).
   *
   * @param sessionId - UUID estable de la conversación (generado por el frontend)
   * @param context   - Campos a actualizar/crear (merge con contexto existente)
   */
  saveSessionContext(sessionId: string, context: SessionContext): Promise<void>;

  /**
   * Recupera el contexto de sesión desde Redis.
   * Retorna null si la sesión no existe o Redis está caído.
   *
   * @param sessionId - UUID estable de la conversación
   */
  getSessionContext(sessionId: string): Promise<SessionContext | null>;

  /**
   * Elimina completamente la sesión de Redis.
   * Usar al iniciar una nueva conversación o al detectar un cambio de usuario.
   *
   * @param sessionId - UUID estable de la conversación
   */
  clearSession(sessionId: string): Promise<void>;
}

// ─── Implementación ──────────────────────────────────────────────────────────

@injectable()
@singleton()
export class SessionMemoryService implements ISessionMemoryService {
  private buildKey(sessionId: string): string {
    return `${KEY_PREFIX}${sessionId}`;
  }

  async saveSessionContext(sessionId: string, context: SessionContext): Promise<void> {
    if (!sessionId?.trim()) return;

    try {
      const key = this.buildKey(sessionId);

      // Merge: leemos el contexto actual primero para no sobreescribir campos existentes.
      const existing = await this.getSessionContext(sessionId);
      const merged: SessionContext = { ...existing, ...context };

      await redisClient.setEx(key, SESSION_TTL_SECONDS, JSON.stringify(merged));

      logger.debug({ sessionId, keys: Object.keys(context) }, 'SessionMemory: context saved');
    } catch (err) {
      // Non-blocking: log pero no propaga. Redis inaccesible no debe romper el flujo.
      logger.warn(
        { sessionId, error: (err as Error).message },
        'SessionMemory: failed to save session context — degraded mode'
      );
    }
  }

  async getSessionContext(sessionId: string): Promise<SessionContext | null> {
    if (!sessionId?.trim()) return null;

    try {
      const raw = await redisClient.get(this.buildKey(sessionId));
      if (!raw) return null;

      return JSON.parse(raw) as SessionContext;
    } catch (err) {
      logger.warn(
        { sessionId, error: (err as Error).message },
        'SessionMemory: failed to get session context — degraded mode'
      );
      return null;
    }
  }

  async clearSession(sessionId: string): Promise<void> {
    if (!sessionId?.trim()) return;

    try {
      await redisClient.del(this.buildKey(sessionId));
      logger.debug({ sessionId }, 'SessionMemory: session cleared');
    } catch (err) {
      logger.warn(
        { sessionId, error: (err as Error).message },
        'SessionMemory: failed to clear session — degraded mode'
      );
    }
  }
}
