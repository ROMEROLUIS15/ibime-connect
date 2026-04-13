/**
 * frontend/src/services/contact.service.ts
 *
 * All contact-related data operations.
 * Components call these functions — they never touch Supabase directly.
 */

import type { CreateContactMessageInput } from '@shared/validators/schemas';
import { apiFetch } from '@/lib/api-url';

export async function submitContactMessage(
  input: CreateContactMessageInput,
) {
  return apiFetch('contact', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
