import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role ("secret key") client. BYPASSES Row Level Security.
 *
 * Use ONLY from Server Actions that have already verified the caller is an
 * admin (see lib/auth/require-admin.js), and only for operations the user's
 * own JWT cannot perform — e.g. auth.admin.inviteUserByEmail.
 *
 * `import "server-only"` makes the build fail if this file is ever pulled into
 * a Client Component, so the secret key can never reach the browser bundle.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not set (server-only).");
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
