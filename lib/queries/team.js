import { FULL_WORKLOAD_HOURS } from "@/lib/constants";
import { ilikePattern } from "@/lib/search-params";

/**
 * Server-side reads for the Team page. Call with a request-bound client
 * from requireAdmin()/requireAdminAction() so RLS applies.
 */

/** All profiles (admins first) merged with workload figures for employees. */
export async function listProfiles(supabase, { q = "" } = {}) {
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, role, job_title, is_active, created_at")
    .order("role", { ascending: true })
    .order("full_name", { ascending: true });
  if (q) {
    const p = ilikePattern(q);
    query = query.or(`full_name.ilike.${p},email.ilike.${p},job_title.ilike.${p}`);
  }

  const [profiles, workload] = await Promise.all([
    query,
    supabase.from("employee_workload_view").select("id, open_task_count, overdue_task_count, hours_due_this_week, workload_percent"),
  ]);
  if (profiles.error) throw profiles.error;
  if (workload.error) throw workload.error;

  const byId = new Map((workload.data ?? []).map((w) => [w.id, w]));
  return (profiles.data ?? []).map((p) => {
    const w = byId.get(p.id);
    return {
      ...p,
      open_task_count: w?.open_task_count ?? 0,
      overdue_task_count: w?.overdue_task_count ?? 0,
      hours_due_this_week: Number(w?.hours_due_this_week ?? 0),
      workload_percent: w?.workload_percent ?? 0,
    };
  });
}

/** KPI tiles: active employees, average workload %, overloaded count. */
export async function getTeamStats(supabase) {
  const { data, error } = await supabase
    .from("employee_workload_view")
    .select("workload_percent, hours_due_this_week")
    .eq("is_active", true);
  if (error) throw error;
  const rows = data ?? [];
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.workload_percent, 0) / rows.length) : 0;
  return {
    employees: rows.length,
    avgWorkload: avg,
    overloaded: rows.filter((r) => Number(r.hours_due_this_week) > FULL_WORKLOAD_HOURS * 0.85).length,
  };
}
