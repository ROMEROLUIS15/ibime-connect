/**
 * frontend/src/services/contact.service.ts
 *
 * All contact-related data operations.
 * Components call these functions — they never touch Supabase directly.
 *
 * Phase 2: replace `supabase.from(...)` calls with `fetch('/api/contact/...')`
 * without changing any component code.
 */

import { supabase } from '../lib/supabase';
import type { ApiResult } from '../../../shared/types/domain';
import type { CreateContactMessageInput } from '../../../shared/validators/schemas';

export async function submitContactMessage(
  input: CreateContactMessageInput,
): Promise<ApiResult<void>> {
  try {
    const { error } = await supabase.from('contact_messages').insert({
      name: input.name,
      email: input.email,
      message: input.message,
    });

    if (error !== null) {
      console.error('[ContactService] Supabase error:', error.message);
      return { ok: false, error: 'No se pudo enviar el mensaje. Intenta de nuevo.' };
    }

    return { ok: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[ContactService] Unexpected error:', message);
    return { ok: false, error: 'Error inesperado. Por favor contacta al administrador.' };
  }
}
