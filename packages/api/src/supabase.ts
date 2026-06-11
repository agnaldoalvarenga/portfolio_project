import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@ostentaculus/security/env";

/**
 * Server-side Supabase client (service role — bypasses RLS; never expose to the
 * browser). Used for auth admin and MFA flows in the API. The browser/app uses
 * the anon key with the user's session instead.
 */
let cached: SupabaseClient | null = null;

export function serverSupabase(): SupabaseClient {
  if (cached) return cached;
  const env = getEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  cached = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
