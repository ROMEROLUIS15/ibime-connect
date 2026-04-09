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

    const endpoint = baseUrl.endsWith('/api') ? `${baseUrl}/contact` : `${baseUrl}/api/contact`;
    console.log(`[ContactService] Enviando a: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[ContactService] API error:', errorData.error);
      return { ok: false, error: errorData.error || 'No se pudo enviar el mensaje.' };
    }

    return { ok: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[ContactService] Unexpected error:', message);
    return { ok: false, error: 'Error de conexión. Intenta de nuevo.' };
  }
}
