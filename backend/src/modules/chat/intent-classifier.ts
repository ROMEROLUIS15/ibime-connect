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
  // PRIORIDAD 0: El mensaje contiene o ES un email → siempre es registro.
  // Cubre el caso crítico: usuario responde con su correo a la pregunta del asistente.
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  if (emailRegex.test(normalized)) {
    return { intent: 'registration', confidence: 'high' };
  }

  // ─── Registration intent ──────────────────────────────────────────────────
  // User is asking about THEIR OWN enrollments/registrations.
  // Every pattern names the enrollment itself: a bare "estoy" or "ver mi" is not
  // enough ("Estoy buscando un libro de Cervantes" used to return the user's courses).
  const registrationPatterns = [
    // Direct personal: "mi curso", "mis inscripciones", "verificar mi inscripción"
    /\bmi(s)?\s+(curso|inscripci[oó]n|registro|curso[s]?|taller|capacitaci[oó]n)/i,
    // "estoy inscrito", "estoy registrada", "estoy en la lista", "aparezco inscrito"
    /\b(estoy|aparezco)\s+(inscrit|registrad|anotad|matriculad|apuntad|en\s+(la\s+)?lista)/i,
    // "en qué cursos estoy"
    /\ben\s+qu[eé]\s+(cursos?|talleres?)\s+estoy\b/i,
    // "me inscribí" (not "me inscribo": that is a future intent, handled as catalog)
    /\b(me inscrib|tengo inscri)\b/i,
    // "mis cursos", "mi inscripción"
    /\bmi(s)?\s+(cursos?|inscripcione|registro|tallere|capacitacion)/i,
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

  // ─── Registration continuation: respuesta que es (casi) solo un teléfono ───
  // El asistente solo pide un teléfono dentro del flujo de verificación de
  // inscripciones. Una respuesta mayormente numérica (7-15 dígitos, poco texto)
  // se trata como continuación de ese flujo. Se evalúa DESPUÉS de catálogo para
  // no secuestrar mensajes como "quiero el curso, mi número 0412...".
  const digitCount = (normalized.match(/\d/g) || []).length;
  const letterCount = (normalized.match(/[a-záéíóúñ]/gi) || []).length;
  const looksLikePhone =
    digitCount >= 7 && digitCount <= 15 && letterCount <= 15 && /\+?\d[\d\s().-]{5,}\d/.test(normalized);
  if (looksLikePhone) {
    return { intent: 'registration', confidence: 'low' };
  }

  // ─── General (fallback) ───────────────────────────────────────────────────
  return { intent: 'general', confidence: 'low' };
}
