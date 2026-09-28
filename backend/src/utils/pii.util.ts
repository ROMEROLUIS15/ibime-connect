/**
 * pii.util — Enmascarado de datos personales para logs de auditoría.
 *
 * Nunca registramos correos en claro: la auditoría necesita correlacionar
 * intentos sin exponer PII en los logs (que pueden ir a terceros: Logtail, etc.).
 */

/**
 * Enmascara un correo conservando el primer carácter del usuario y el dominio.
 *   "juan.perez@gmail.com" → "j***@gmail.com"
 *   "a@x.com"              → "*@x.com"
 * Entrada inválida → "***".
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '***';
  }
  const [local, domain] = email.split('@');
  if (local.length <= 1) {
    return `*@${domain}`;
  }
  return `${local[0]}***@${domain}`;
}

const EMAIL_IN_TEXT = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_IN_TEXT = /\+?\d[\d\s().-]{5,}\d/g;
const MIN_PHONE_DIGITS = 7;

/**
 * Enmascara los correos y teléfonos que aparezcan dentro de un texto libre,
 * p. ej. el cuerpo de un error de un proveedor externo que repite lo que el
 * usuario escribió. Los correos quedan como `maskEmail`; los teléfonos (7 o
 * más dígitos, con o sin separadores) conservan solo sus 2 últimos dígitos.
 *   "tool_use_failed ... ana.perez@test.com, 04121234567" →
 *   "tool_use_failed ... a***@test.com, ***67"
 */
export function maskPiiInText(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_IN_TEXT, (email) => maskEmail(email))
    .replace(PHONE_IN_TEXT, (candidate) => {
      const digits = candidate.replace(/\D/g, '');
      return digits.length >= MIN_PHONE_DIGITS ? `***${digits.slice(-2)}` : candidate;
    });
}
