/**
 * frontend/src/lib/supabase.ts
 *
 * Single Supabase client instance for the entire frontend.
 * All service files import from HERE — never from the auto-generated client.
 *
 * When the backend is decoupled in Phase 2, only the service files change.
 * This file becomes the adapter to the Express API instead of Supabase directly.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

function getEnvVar(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    throw new Error(
      `[IBIME] Missing environment variable: ${key}. ` +
        'Check your .env file and ensure all VITE_ variables are set.',
    );
  }
  return value;
}

let _client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (_client !== null) return _client;

  _client = createClient<Database>(
    getEnvVar('VITE_SUPABASE_URL'),
    getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY'),
    {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  );

  return _client;
}

/** Typed shorthand — use this everywhere in service files */
export const supabase = getSupabaseClient();
