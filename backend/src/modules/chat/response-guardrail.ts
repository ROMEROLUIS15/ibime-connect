/**
 * Response Guardrail — Post-generation safety check.
 *
 * Executes AFTER every LLM response to detect and block hallucinations.
 * Specifically targets user-state hallucinations (registration status, account state).
 *
 * If a violation is detected, the response is REPLACED with a safe fallback.
 */

export interface GuardrailResult {
  passed: boolean;
  reason: string | null;
  safeResponse: string | null;
}

/**
 * Patterns that indicate the LLM is making claims about a user's personal state.
 * These are ONLY safe when the response came from the registration flow (where DB data was injected).
 * In catalog/general flows, ANY such claim is a hallucination.
 */
const USER_STATE_PATTERNS = [
  // Negative registration claims (most dangerous — fabricating "you are not registered")
  /\bno\s+(est[aá]s|eres|tiene|se\s+encontr[oa]|aparece)\b.*\b(inscrit|registrad|cuent|suscrib)/i,
  /\bno\s+(est[aá]|fue|hay)\b.*\b(inscripci[oó]n|registro|cuenta)/i,
  // "No se encontr[ó/aron] inscripciones para tu/este correo"
  /\bno\s+se\s+encontr[oa]?\b.*\b(inscripci[oó]n|registro|curso)/i,
  // "Tu cuenta no" / "No tienes cuenta" / "No tienes inscripciones"
  /\b(no\s+tiene|no\s+posee|no\s+cuenta|sin\s+cuenta|sin\s+inscripci[oó]n|no\s+estas\b.*\bregistr)/i,
  // Direct claims: "no estás registrado", "no estás inscrito"
  /\bno\s+est[aá]s\s+(inscrit|registrad)/i,
  /\bno\s+se\s+encontr[oa]\s+tu\b/i,
  /\btu\s+cuenta\s+no/i,
  /\bno\s+exist.*\b(inscripci[oó]n|registro|cuenta)\b.*\b(tu|este|ese)/i,
  // "El correo no está registrado" / "Ese email no aparece"
  /\b(correo|email|direcci[oó]n)\s+no\s+(est[aá]|figur|aparec|registr)/i,
  // "no apareces en" / "no aparece en"
  /\bno\s+(apareces|aparece|figuras|figura)\s+(en|para|de)\b/i,
  // "no está registrado" (generic — covers "el correo no está registrado")
  /\bno\s+est[aá]\s+registrad/i,
];

/**
 * Safe fallback when a hallucination is detected.
 *
 * Sirve para los dos casos que bloquea la barrera: una afirmación inventada sobre
 * el usuario ("no estás inscrito") y una respuesta general que coincide con un
 * patrón sin hablar del usuario ("no se encontró información sobre ese curso").
 * No es el texto de la barrera de privacidad (segundo correo en la sesión), que
 * vive en el orquestador.
 */
const SAFE_FALLBACK = 'Para no darte información que no pueda confirmar, prefiero verificarla primero. Si tu consulta es sobre tus inscripciones, indícame tu correo electrónico registrado y la reviso en nuestro sistema. Para cualquier otra duda, puedes contactarnos al 0274-2623898 o a contactoibime@gmail.com.';

/**
 * Check if the response is from a registration flow (where DB data was explicitly provided).
 * In that case, user-state claims are legitimate because they come from DB data.
 */
function isRegistrationContext(flow: string): boolean {
  return flow === 'registration';
}

/**
 * Run the guardrail check.
 *
 * @param response - The LLM-generated response text
 * @param flow - The flow that produced this response ('registration' | 'catalog' | 'general')
 * @returns GuardrailResult
 */
export function checkResponseGuardrail(
  response: string,
  flow: 'registration' | 'catalog' | 'general'
): GuardrailResult {
  if (!response || response.trim() === '') {
    return { passed: false, reason: 'Empty response', safeResponse: SAFE_FALLBACK };
  }

  // Registration flow is allowed to make user-state claims (DB-backed)
  if (isRegistrationContext(flow)) {
    return { passed: true, reason: null, safeResponse: null };
  }

  // Check all dangerous patterns
  for (const pattern of USER_STATE_PATTERNS) {
    if (pattern.test(response)) {
      return {
        passed: false,
        reason: `Blocked user-state hallucination: pattern "${pattern.source}" matched`,
        safeResponse: SAFE_FALLBACK,
      };
    }
  }

  return { passed: true, reason: null, safeResponse: null };
}
