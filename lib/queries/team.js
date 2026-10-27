/**
 * Server-side reads for the Team page. Call with a request-bound client
 * from requireAdmin()/requireAdminAction() so RLS applies.
 */
export async function listProfiles(supabase) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, job_title, is_active, created_at")
    .order("role", { ascending: true }) // admins first
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
