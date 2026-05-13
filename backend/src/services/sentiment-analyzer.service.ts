/**
 * SentimentAnalyzerService — Capa de inteligencia emocional síncrona y pura.
 *
 * Detecta frustración del usuario mediante heurísticas deterministas (<10ms).
 * No hace llamadas externas. Completamente independiente del LLM y de la DB.
 *
 * SOLID: Esta clase es la ÚNICA responsable del análisis de sentimiento.
 * El orquestador solo consume { isFrustrated, score }.
 */

import { injectable, singleton } from 'tsyringe';

export interface SentimentResult {
  isFrustrated: boolean;
  /** Puntuación acumulada (umbral: >= 2 = frustrado) */
  score: number;
}

// ─── Patrones de alta señal (+2 puntos cada uno) ─────────────────────────────
// Palabras que por sí solas indican insatisfacción clara.
const HIGH_SIGNAL_PATTERNS: RegExp[] = [
  /\bp[eé]simo\b/i,
  /\bes\s+un\s+asco\b/i,
  /\bhorrible\b/i,
  /\bterrible\b/i,
  /\bmal\s+servicio\b/i,
  /\bharto\b/i,
  /\bcansado\b/i,
  /\bdesesperado\b/i,
  /\bno\s+funciona\b/i,
  /\bno\s+sirve\b/i,
  /\bno\s+me\s+atienden\b/i,
  /\bno\s+responde\b/i,
  /\bes\s+una\s+basura\b/i,
];

// ─── Patrones de señal media (+1 punto cada uno) ──────────────────────────────
// Palabras ambiguas que combinadas con otras señales indican frustración.
const MEDIUM_SIGNAL_PATTERNS: RegExp[] = [
  /\bhumano\b/i,        // quiere agente humano
  /\bayuda\b/i,
  /\berror\b/i,
  /\bno\s+entiendo\b/i,
  /\bno\s+puedo\b/i,
  /\bno\s+me\s+ayuda\b/i,
  /\bno\s+entiende\b/i,
  /\bpor\s+favor\b/i,
  /\burgente\b/i,
  /\bproblema\b/i,
];

@injectable()
@singleton()
export class SentimentAnalyzerService {
  /**
   * Analiza el mensaje del usuario y devuelve si está frustrado.
   * Método síncrono puro — nunca bloquea el flujo principal.
   *
   * Reglas (umbral de frustración: score >= 2):
   *   1. Mayúsculas sostenidas: >70% del texto en caps → +2
   *   2. Patrón de alta señal coincidente → +2 por patrón
   *   3. Patrón de señal media coincidente → +1 por patrón
   *   4. Abuso de signos (!!! o ???): → +2
   */
  analyzeMessage(userMessage: string): SentimentResult {
    let score = 0;
    const msg = userMessage.trim();

    // ── Regla 1: Mayúsculas sostenidas ───────────────────────────────────────
    if (msg.length > 6) {
      const letters = msg.replace(/[^a-zA-Z]/g, '');
      if (letters.length > 0) {
        const upperCount = (msg.match(/[A-Z]/g) ?? []).length;
        if (upperCount / letters.length > 0.7) {
          score += 2;
        }
      }
    }

    // ── Regla 2: Patrones de alta señal ──────────────────────────────────────
    for (const pattern of HIGH_SIGNAL_PATTERNS) {
      if (pattern.test(msg)) {
        score += 2;
      }
    }

    // ── Regla 3: Patrones de señal media ─────────────────────────────────────
    for (const pattern of MEDIUM_SIGNAL_PATTERNS) {
      if (pattern.test(msg)) {
        score += 1;
      }
    }

    // ── Regla 4: Abuso de signos de exclamación o interrogación ──────────────
    if (/[!?]{3,}/.test(msg)) {
      score += 2;
    }

    return { isFrustrated: score >= 2, score };
  }
}
