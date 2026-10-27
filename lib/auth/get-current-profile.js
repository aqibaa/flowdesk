import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the signed-in user's profile (or null). The JWT is verified with
 * getClaims(); the role comes from profiles.role — never from the JWT or
 * user_metadata.
 *
 * Wrapped in React.cache so layouts, pages and actions in the same request
 * share one lookup.
 *
 * @returns {Promise<{ supabase: import("@supabase/supabase-js").SupabaseClient, profile: object|null }>}
 */
export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = !error && data?.claims?.sub ? data.claims.sub : null;

  if (!userId) return { supabase, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, job_title, is_active, created_at")
    .eq("id", userId)
    .single();

  return { supabase, profile: profile ?? null };
});
