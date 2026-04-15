/**
 * IntentClassifier — Deterministic intent classification (NO LLM)
 *
 * Classifies user messages into one of three intents:
 *   - "registration": User is asking about their personal course enrollments
 *   - "catalog": User is asking about available courses, workshops, or catalog
 *   - "general": Everything else (institutional info, greetings, out-of-scope)
 *
 * Uses simple pattern matching (keywords + regex). No external dependencies.
 */

export type ChatIntent = 'registration' | 'catalog' | 'general';

export interface IntentResult {
  intent: ChatIntent;
  confidence: 'high' | 'low';
}

/**
 * Pure function — no side effects, no LLM, no state.
 */
export function classifyIntent(userMessage: string): IntentResult {
  const normalized = userMessage.toLowerCase().trim();

  // ─── Registration intent ──────────────────────────────────────────────────
  // User is asking about THEIR OWN enrollments/registrations.
  // Keywords that indicate a personal query (possessive pronouns + course/inscription).
  const registrationPatterns = [
    // Direct personal: "mi curso", "mis inscripciones", "mi correo"
    /\bmi(s)?\s+(curso|inscripci[oó]n|registro|curso[s]?|taller|capacitaci[oó]n)/i,
    // "en qué cursos estoy", "estoy inscrito", "me inscribí"
    /\b(estoy|estoy inscrit|me inscrib|aparec|tengo inscri|revisar mi|ver mi|consultar mi|saber si estoy)\b/i,
    // "mis cursos", "mi inscripción"
    /\bmi(s)?\s+(cursos?|inscripcione|registro|tallere|capacitacion)/i,
    // "cómo sé si estoy registrado", "verificar mi inscripción"
    /\b(verificar mi|confirmar mi)\b/i,
  ];

  for (const pattern of registrationPatterns) {
    if (pattern.test(normalized)) {
      return { intent: 'registration', confidence: 'high' };
    }
  }

  // ─── Catalog intent ───────────────────────────────────────────────────────
  // User is asking about available offerings in general (not personal).
  const catalogPatterns = [
    // "qué cursos tienen", "qué talleres hay", "cursos disponibles"
    /\b(qué|que|cuáles|cuales|cual|como|cómo)\s+(cursos?|talleres?|capacitaciones?|programas?|actividades?|ofrecen|tienen|hay|disponibles|puedo tomar)/i,
    // "cursos de ...", "taller de ...", "capacitación de ..."
    /\b(cursos?|talleres?|capacitaci[oó]n|programas?)\s+(de|para|sobre|en)\b/i,
    // Standalone: "taller de X", "curso de X" at start of string
    /^\s*(curso|taller|capacitaci[oó]n)\s+(de|para|sobre|en)\b/i,
    // "catálogo", "oferta académica", "programas"
    /\b(cat[aá]logo|oferta|programas? disponibles?|lista de cursos?|todas las actividade)/i,
    // "puedo inscribirme", "cómo me inscribo" (future intent, not past state)
    /\b(c[oó]mo\s+(me|puedo)\s+(inscrib|registr|anot|apunt)|quiero\s+inscribir|puedo\s+inscribir)/i,
  ];

  for (const pattern of catalogPatterns) {
    if (pattern.test(normalized)) {
      return { intent: 'catalog', confidence: 'high' };
    }
  }

  // ─── General (fallback) ───────────────────────────────────────────────────
  return { intent: 'general', confidence: 'low' };
}
