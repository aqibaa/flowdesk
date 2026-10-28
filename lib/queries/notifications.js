/** Own notifications (RLS scopes to auth.uid()). */
export async function listMyNotifications(supabase, limit = 10) {
  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, task_id, project_id, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
  ]);
  if (error) throw error;
  return { items: data ?? [], unread: count ?? 0 };
}
