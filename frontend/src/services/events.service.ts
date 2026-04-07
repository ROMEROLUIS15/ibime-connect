/**
 * frontend/src/services/events.service.ts
 *
 * All event registration data operations.
 * Extracted from EventsSection.tsx — that component had Supabase calls inline.
 */

import { supabase } from '../lib/supabase';
import type { ApiResult } from '../../../shared/types/domain';
import type { CreateCourseRegistrationInput } from '../../../shared/validators/schemas';

export async function registerForEvent(
  input: CreateCourseRegistrationInput,
): Promise<ApiResult<void>> {
  try {
    const { error } = await supabase.from('course_registrations').insert({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      course_name: input.courseName,
    });

    if (error !== null) {
      console.error('[EventsService] Supabase error:', error.message);
      return { ok: false, error: 'No se pudo completar la inscripción. Intenta de nuevo.' };
    }

    return { ok: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[EventsService] Unexpected error:', message);
    return { ok: false, error: 'Error inesperado. Por favor contacta al administrador.' };
  }
}
