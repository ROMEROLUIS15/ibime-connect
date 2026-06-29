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
