/**
 * EmailValidator — Strict email validation for backend-side verification.
 *
 * The frontend may or may not provide userEmail. When it does:
 *   - Validate with a strict RFC-style regex
 *   - Reject malformed emails before they reach DB queries
 *
 * When it doesn't:
 *   - Mark as unauthenticated
 *   - Registration flow must return deterministic "provide email" response
 */

export interface EmailValidationResult {
  valid: boolean;
  email: string | null;
  reason: string | null;
}

/**
 * Strict email regex: validates format including domain with TLD.
 * Allows: user@domain.com, user.name+tag@sub.domain.co.uk
 * Rejects: @domain.com, user@, user@.com, plain text
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string | undefined | null): EmailValidationResult {
  if (!email || email.trim() === '') {
    return { valid: false, email: null, reason: 'No email provided — user is unauthenticated' };
  }

  const normalized = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, email: null, reason: `Invalid email format: "${email}"` };
  }

  return { valid: true, email: normalized, reason: null };
}
