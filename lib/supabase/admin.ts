import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Admin client — service role key, BYPASSES RLS.
// Server-side only ("server-only" import guarantees it can never reach the client bundle).
// Use exclusively for admin tasks: inviting users, changing roles.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
