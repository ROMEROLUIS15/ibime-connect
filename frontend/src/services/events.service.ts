/**
 * frontend/src/services/events.service.ts
 *
 * All event registration data operations.
 */

import type { CreateCourseRegistrationInput } from '@shared/validators/schemas';
import { apiFetch } from '@/lib/api-url';

export async function registerForEvent(
  input: CreateCourseRegistrationInput,
) {
  return apiFetch('registrations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
