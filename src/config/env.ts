/**
 * Environment configuration. Vite only exposes variables prefixed with
 * `VITE_` — secret keys (service_role) must never be placed in this file
 * or anywhere in frontend code.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as
  | string
  | undefined;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

/** True when real Supabase credentials are configured. */
export const isSupabaseConfigured =
  typeof SUPABASE_URL === "string" &&
  SUPABASE_URL.length > 0 &&
  typeof SUPABASE_ANON_KEY === "string" &&
  SUPABASE_ANON_KEY.length > 0;
