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
 * Respuesta sustituta cuando el modelo afirma que el IBIME tiene un libro, obra,
 * colección o ejemplar sin que el contexto recuperado lo respalde.
 */
export const HOLDINGS_SAFE_RESPONSE = 'No tengo acceso al inventario de las bibliotecas del IBIME. Puedes buscar si un título está disponible en el catálogo en línea (Koha): http://www.ibime.gob.ve:8000/, o preguntar en la biblioteca más cercana.';

/** Letra a letra [Xx], para no usar el flag `i` (hace falta distinguir mayúsculas en los nombres propios). */
const anyCase = (word: string): string => word.replace(/[a-záéíóúñ]/gi, (c) => `[${c.toLowerCase()}${c.toUpperCase()}]`);

// Verbo de posesión: primera persona del plural, o sujeto institucional + verbo, en una misma oración.
const FIRST_PERSON = String.raw`\b(?:${['contamos', 'disponemos', 'tenemos', 'poseemos'].map(anyCase).join('|')})\b`;
const INSTITUTION_SUBJECTS = [
  String.raw`${anyCase('el')}\s+IBIME`,
  String.raw`${anyCase('la')}\s+${anyCase('red')}(?:\s+${anyCase('bibliotecaria')})?`,
  String.raw`(?:${anyCase('las')}|${anyCase('nuestras')})\s+${anyCase('bibliotecas')}`,
];
const INSTITUTION =
  String.raw`\b(?:${INSTITUTION_SUBJECTS.join('|')})\b[^.!?\n]*?\b(?:cuentan?\s+con|disponen?\s+de|tienen?|poseen?)\b`;
const HOLDS = `(?:${FIRST_PERSON}|${INSTITUTION})`;
const SAME_SENTENCE = String.raw`[^.!?\n]*?`;
const WORKS = String.raw`\b(?:libros?|obras?|t[ií]tulos?|ejemplar(?:es)?)`;

/**
 * Afirmaciones de que el IBIME tiene material concreto, dentro de una misma oración
 * (sin . ! ? ni salto de línea), con verbo de posesión en primera persona del plural
 * ("contamos", "tenemos"…) o sujeto institucional ("el IBIME cuenta con…"):
 *   1. una colección DE/SOBRE algo (excepto audiolibros: Libro Hablado)
 *   2. libros/obras/títulos/ejemplares DE un nombre propio (mayúscula) o SOBRE un tema
 *   3. un título concreto: "tenemos el libro «X»" / "el libro Cien años…"
 * Frases genéricas ("acceso a libros", "obras de autores venezolanos", "58 bibliotecas") no coinciden.
 * Solo se aplican si ninguna fuente recuperada es del Fondo Editorial.
 */
const HOLDINGS_PATTERNS = [
  new RegExp(String.raw`${HOLDS}${SAME_SENTENCE}colecci[oó]n(?:es)?\s+(?:de|sobre)\s+(?!audiolibros)`),
  new RegExp(String.raw`${HOLDS}${SAME_SENTENCE}${WORKS}\s+(?:(?:de|del)\s+[A-ZÁÉÍÓÚÑ]|sobre\s)`),
  new RegExp(String.raw`${HOLDS}\s+(?:el|la)\s+(?:libro|obra|t[ií]tulo|ejemplar)\s+[«"“*A-ZÁÉÍÓÚÑ]`),
];

export interface GuardrailOptions {
  /** True si alguna fuente recuperada es un documento del Fondo Editorial. */
  hasFondoEditorialSource?: boolean;
}

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
 * @param options - Retrieval context (see GuardrailOptions)
 * @returns GuardrailResult
 */
export function checkResponseGuardrail(
  response: string,
  flow: 'registration' | 'catalog' | 'general',
  options: GuardrailOptions = {}
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

  if (!options.hasFondoEditorialSource) {
    for (const pattern of HOLDINGS_PATTERNS) {
      if (pattern.test(response)) {
        return {
          passed: false,
          reason: `Unsupported holdings claim: pattern "${pattern.source}" matched`,
          safeResponse: HOLDINGS_SAFE_RESPONSE,
        };
      }
    }
  }

  return { passed: true, reason: null, safeResponse: null };
}
