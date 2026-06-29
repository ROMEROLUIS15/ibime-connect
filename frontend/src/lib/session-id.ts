/**
 * src/lib/session-id.ts
 *
 * Genera un UUID v4 estable para identificar una conversación de chat.
 *
 * El backend usa este sessionId como clave autoritativa en Redis para el
 * Privacy Gate (fuente del servidor, a prueba de manipulación del cliente).
 * Sin un sessionId real, el gate caía al fallback por hash del historial,
 * que es manipulable desde un cliente modificado.
 *
 * Prefiere `crypto.randomUUID()` (disponible en contextos seguros: HTTPS y
 * localhost). Incluye un fallback RFC 4122 v4 por si se sirve en un contexto
 * no seguro o un navegador antiguo donde `randomUUID` no exista.
 */
export function createSessionId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }

  // Fallback: UUID v4 conforme a RFC 4122 (válido para el schema Zod del backend).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}
