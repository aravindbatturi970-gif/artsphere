import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/config/env";

/**
 * Remember-me support: Supabase's storage adapter is fixed at client
 * creation, so "remember me" is honoured by keeping two clients — one
 * localStorage-backed (persistent) and one sessionStorage-backed
 * (tab-only) — and selecting at sign-in time.
 */
let client: SupabaseClient | null = null;

function buildClient(storage: Storage): SupabaseClient {
  if (!isSupabaseConfigured || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * The persistent client (localStorage). Safe to export for non-auth uses
 * (future realtime, storage, etc.) — the anon key is public by design.
 */
export function getSupabase(): SupabaseClient {
  if (!client) client = buildClient(window.localStorage);
  return client;
}

/** The session-only client used when "Remember me" is unchecked. */
export function getSupabaseSessionOnly(): SupabaseClient {
  return buildClient(window.sessionStorage);
}

export { isSupabaseConfigured };
