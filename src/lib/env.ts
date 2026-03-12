/**
 * Type-safe environment variables
 * All environment variables are validated at runtime in development mode
 */

interface EnvConfig {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    VITE_GEMINI_API_KEY?: string;
    VITE_OPEN_METEO_BASE_URL?: string;
}

function getEnv(): EnvConfig {
    const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const VITE_OPEN_METEO_BASE_URL = import.meta.env.VITE_OPEN_METEO_BASE_URL;

    // Validation - only in development to avoid runtime overhead in production
    if (import.meta.env.DEV) {
        if (!VITE_SUPABASE_URL) {
            console.error('❌ Missing VITE_SUPABASE_URL in environment variables');
        }
        if (!VITE_SUPABASE_ANON_KEY) {
            console.error('❌ Missing VITE_SUPABASE_ANON_KEY in environment variables');
        }

        const missingVars: string[] = [];
        if (!VITE_SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
        if (!VITE_SUPABASE_ANON_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY');

        if (missingVars.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missingVars.join(', ')}. ` +
                `Please copy .env.example to .env and fill in the values.`
            );
        }
    }

    return {
        VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY,
        VITE_GEMINI_API_KEY,
        VITE_OPEN_METEO_BASE_URL,
    };
}

export const env = getEnv();

// Re-export for convenience
export const {
    VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY,
    VITE_GEMINI_API_KEY,
    VITE_OPEN_METEO_BASE_URL,
} = env;
