/**
 * ResponsePolicy — Centralized final-response validation and fallback engine.
 *
 * This is the LAST gate before any response reaches the user. It:
 *   1. Validates structural integrity of the response
 *   2. Checks for hallucination patterns (delegates to guardrail)
 *   3. Returns intent-specific fallbacks when validation fails
 *
 * The LLM NEVER produces the final output — this policy does.
 */

import { checkResponseGuardrail, type GuardrailOptions } from './response-guardrail.js';

export type ChatIntent = 'registration' | 'catalog' | 'general';

export interface PolicyValidationResult {
  valid: boolean;
  answer: string;
  reason: string | null;
  /**
   * Set only when a long, non-DB-backed answer was cut to its last complete
   * sentence: the original length (chars) before trimming. The answer stays valid.
   */
  trimmedFrom?: number;
}

/**
 * Intent-specific fallback messages.
 * Each is tailored to the user's question context — not a generic message.
 */
const FALLBACKS: Record<ChatIntent, string> = {
  registration: '¡Claro que sí! Con mucho gusto te ayudo a verificar tus inscripciones. Por favor, indícame tu correo electrónico registrado para buscarlo en nuestro sistema.',
  catalog: 'Actualmente no tengo información detallada sobre ese tema en nuestra base de conocimientos. Te invito a contactarnos al teléfono 0274-2623898 o al correo contactoibime@gmail.com para recibir información actualizada sobre nuestros cursos y talleres.',
  general: '¡Gracias por tu interés! No tengo información específica sobre ese tema en mi base de conocimientos. Te recomiendo contactarnos al teléfono 0274-2623898, al correo contactoibime@gmail.com o visitar nuestras redes sociales @ibimegob para más información. ¡Estoy aquí para ayudarte en lo que necesites!',
};

/**
 * Returns the intent-specific fallback without running any validation.
 * Used by flows that must short-circuit before calling the LLM (e.g. a RAG miss
 * in the catalog flow), so the deterministic answer stays defined in one place.
 */
export function getIntentFallback(intent: ChatIntent): string {
  return FALLBACKS[intent];
}

/**
 * Maximum acceptable answer length (characters).
 * Prevents runaway LLM responses.
 */
const MAX_ANSWER_LENGTH = 1500;

/**
 * Minimum acceptable answer length (characters).
 * Rejects degenerate one-word responses from LLM.
 */
const MIN_ANSWER_LENGTH = 10;

/**
 * Run the full response policy check.
 *
 * Order of validation:
 *   1. Structural checks (empty, too short, too long). A too-long LLM answer is
 *      trimmed to its last complete sentence; a DB-backed one falls back
 *   2. Guardrail pattern check (hallucination detection)
 *   3. If any check fails → return intent-specific fallback
 *
 * @param answer - The LLM-generated or deterministic response text
 * @param intent - The classified intent of the user's message
 * @param isDbBacked - Whether the response is backed by verified DB data (registration flow)
 * @param guardrailOptions - Retrieval context for the guardrail (e.g. a Fondo Editorial source was retrieved)
 * @returns PolicyValidationResult with the final safe answer
 */
export function applyResponsePolicy(
  answer: string,
  intent: ChatIntent,
  isDbBacked: boolean,
  guardrailOptions: GuardrailOptions = {}
): PolicyValidationResult {
  let trimmedFrom: number | undefined;

  // ─── 1. Structural validation ──────────────────────────────────────────

  if (!answer || answer.trim() === '') {
    return {
      valid: false,
      answer: FALLBACKS[intent],
      reason: 'Empty response from LLM',
    };
  }

  if (answer.trim().length < MIN_ANSWER_LENGTH) {
    return {
      valid: false,
      answer: FALLBACKS[intent],
      reason: `Response too short (${answer.trim().length} chars, minimum ${MIN_ANSWER_LENGTH})`,
    };
  }

  if (answer.length > MAX_ANSWER_LENGTH) {
    // Only LLM drafts are trimmed. DB-backed answers (e.g. a list of
    // registrations) are never cut: trimming could hide an entry unnoticed.
    const trimmed = isDbBacked
      ? ''
      : trimToLastCompleteSentence(answer.slice(0, MAX_ANSWER_LENGTH)).trim();

    if (trimmed.length < MIN_ANSWER_LENGTH) {
      return {
        valid: false,
        answer: FALLBACKS[intent],
        reason: `Response too long (${answer.length} chars, maximum ${MAX_ANSWER_LENGTH})`,
      };
    }

    trimmedFrom = answer.trim().length;
    answer = trimmed;
  }

  // ─── 2. Guardrail check (hallucination detection) ─────────────────────
  // Skip guardrail for DB-backed responses — they come from verified data.
  //
  // IMPORTANT: When !isDbBacked, we NEVER pass 'registration' to the guardrail.
  // The guardrail whitelists 'registration' unconditionally (any user-state claim
  // is allowed because it assumes DB data was injected). If this policy is called
  // without DB data (isDbBacked=false), that assumption is false — force the
  // guardrail into 'general' mode so hallucinations are blocked.

  if (!isDbBacked) {
    const guardrailFlow = intent === 'registration' ? 'general' : intent;
    const guardrailResult = checkResponseGuardrail(answer, guardrailFlow, guardrailOptions);

    if (!guardrailResult.passed) {
      return {
        valid: false,
        // El texto sustituto lo define la barrera (un solo lugar).
        answer: guardrailResult.safeResponse ?? FALLBACKS[intent],
        reason: guardrailResult.reason,
      };
    }
  }

  // ─── 3. All checks passed ─────────────────────────────────────────────

  return {
    valid: true,
    answer: answer.trim(),
    reason: null,
    ...(trimmedFrom !== undefined && { trimmedFrom }),
  };
}

/**
 * Sentence terminator (., !, ?, …) plus any closing characters (parentheses,
 * markdown emphasis, quotes), only when followed by whitespace or end of text.
 * The lookahead keeps dots inside URLs, emails and numbers (a.pdf, 3.5) from
 * counting as boundaries.
 */
const SENTENCE_END = /[.!?…]+[)\]*_»"'”’]*(?=\s|$)/g;

/**
 * Trims a truncated answer (finishReason === 'length') back to its last
 * complete sentence or complete line, whichever comes later.
 *
 * - A bare list number ("2.") is not a sentence end.
 * - The result never ends on a dangling ":" (it falls back to the previous boundary).
 * - Returns '' when there is no boundary, so the ResponsePolicy applies its fallback.
 */
export function trimToLastCompleteSentence(text: string): string {
  const source = text.trimEnd();
  if (!source) return '';

  let cut = -1;

  for (const match of source.matchAll(SENTENCE_END)) {
    const start = match.index ?? 0;
    const lineStart = source.lastIndexOf('\n', start - 1) + 1;
    const isListNumber = /^\s*\d{1,2}$/.test(source.slice(lineStart, start));
    if (!isListNumber) cut = start + match[0].length;
  }

  // A newline closes the line before it: everything after the last one is the partial line.
  const lastNewline = source.lastIndexOf('\n');
  if (lastNewline > cut) cut = lastNewline;

  if (cut <= 0) return '';

  const trimmed = source.slice(0, cut).trimEnd();
  // Never end on a dangling colon: drop it and cut again at the previous boundary.
  if (trimmed.endsWith(':')) return trimToLastCompleteSentence(trimmed.slice(0, -1));
  return trimmed;
}
