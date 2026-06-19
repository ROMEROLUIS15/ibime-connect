/**
 * phone.util — Comparación de números de teléfono tolerante a formato.
 *
 * Los teléfonos se guardan en `course_registrations.phone` como texto libre
 * (`+58 412-1234567`, `0412 1234567`, `04121234567`, ...). Para verificar la
 * propiedad de una inscripción comparamos solo los dígitos significativos, de
 * modo que el formato exacto que el usuario recuerde no provoque falsos negativos.
 */

/** Cantidad de dígitos finales que se comparan (cubre el número nacional sin prefijo país). */
const SIGNIFICANT_DIGITS = 7;

/** Deja solo los dígitos de un teléfono en texto libre. */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '');
}

/**
 * Determina si dos teléfonos pertenecen al mismo número, ignorando formato,
 * espacios, guiones y prefijo de país. Compara los últimos SIGNIFICANT_DIGITS
 * dígitos. Requiere que ambos tengan al menos esa cantidad de dígitos para
 * evitar coincidencias triviales con cadenas cortas.
 */
export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);

  if (na.length < SIGNIFICANT_DIGITS || nb.length < SIGNIFICANT_DIGITS) {
    return false;
  }

  return na.slice(-SIGNIFICANT_DIGITS) === nb.slice(-SIGNIFICANT_DIGITS);
}
