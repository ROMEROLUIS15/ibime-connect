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
    const defaultLocalUrl = 'http://localhost:3000/api';
    const envUrl = import.meta.env.VITE_API_URL;
    
    let baseUrl = envUrl || defaultLocalUrl;
    
    // En desarrollo, priorizar localhost
    if (import.meta.env.DEV) {
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocalhost && !envUrl?.includes('localhost')) {
        baseUrl = defaultLocalUrl;
      }
    }

    const endpoint = baseUrl.endsWith('/api') ? `${baseUrl}/registrations` : `${baseUrl}/api/registrations`;
    console.log(`[EventsService] Enviando a: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[EventsService] API error:', errorData.error);
      return { ok: false, error: errorData.error || 'No se pudo completar la inscripción.' };
    }

    return { ok: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[EventsService] Unexpected error:', message);
    return { ok: false, error: 'Error de conexión. Intenta de nuevo.' };
  }
}
