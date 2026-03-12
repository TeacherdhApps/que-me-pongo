import { createClient } from '@supabase/supabase-js';
import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from './env';

export const supabase = createClient(
    VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage,
        },
    }
);
