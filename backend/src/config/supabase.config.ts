import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.config.js';

export const supabaseClient = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false, // En backend no necesitamos persistir la sesión de Auth
    }
  }
);
