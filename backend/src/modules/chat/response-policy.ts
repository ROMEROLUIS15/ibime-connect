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

import { checkResponseGuardrail } from './response-guardrail.js';

export type ChatIntent = 'registration' | 'catalog' | 'general';

export interface PolicyValidationResult {
  valid: boolean;
  answer: string;
  reason: string | null;
}

/**
 * Intent-specific fallback messages.
 * Each is tailored to the user's question context — not a generic message.
 */
const FALLBACKS: Record<ChatIntent, string> = {
  registration: '¡Claro que sí! Con mucho gusto te ayudo a verificar tus inscripciones. Por favor, indícame tu correo electrónico registrado para buscarlo en nuestro sistema.',
  catalog: 'Actualmente no tengo información detallada sobre ese tema en nuestra base de conocimientos. Te invito a contactarnos al teléfono 0274-2623898 o al correo contactoibime@gmail.com para recibir información actualizada sobre nuestros cursos y talleres.',
  general: 'No tengo información específica sobre ese tema. Puedes contactarnos al teléfono 0274-2623898 o al correo contactoibime@gmail.com, o visitar nuestras redes sociales @ibimegob para más información.',
};

/**
 * Hallucination-specific fallback — used when guardrail blocks a response.
 * This message is neutral and safe for any flow.
 */
const HALLUCINATION_FALLBACK = 'Puedo ayudarte a consultar los cursos disponibles o tus inscripciones si proporcionas tu correo registrado.';

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
 *   1. Structural checks (empty, too short, too long)
 *   2. Guardrail pattern check (hallucination detection)
 *   3. If any check fails → return intent-specific fallback
 *
 * @param answer - The LLM-generated or deterministic response text
 * @param intent - The classified intent of the user's message
 * @param isDbBacked - Whether the response is backed by verified DB data (registration flow)
 * @returns PolicyValidationResult with the final safe answer
 */
export function applyResponsePolicy(
  answer: string,
  intent: ChatIntent,
  isDbBacked: boolean
): PolicyValidationResult {
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
    return {
      valid: false,
      answer: FALLBACKS[intent],
      reason: `Response too long (${answer.length} chars, maximum ${MAX_ANSWER_LENGTH})`,
    };
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
    const guardrailResult = checkResponseGuardrail(answer, guardrailFlow);

    if (!guardrailResult.passed) {
      return {
        valid: false,
        answer: HALLUCINATION_FALLBACK,
        reason: guardrailResult.reason,
      };
    }
  }

  // ─── 3. All checks passed ─────────────────────────────────────────────

  return {
    valid: true,
    answer: answer.trim(),
    reason: null,
  };
}
