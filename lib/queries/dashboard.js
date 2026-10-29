import { format } from "date-fns";

/**
 * Admin dashboard reads (request-bound client from requireAdmin()).
 * All aggregation happens in Postgres (migration 14 views / function);
 * these helpers only shape the rows for the components.
 */

/** 4 KPI tiles. Overall progress = mean progress of active projects. */
export async function getDashboardKpis(supabase) {
  const { data, error } = await supabase.from("dashboard_kpis_view").select("*").maybeSingle();
  if (error) throw error;
  return {
    clients: data?.clients ?? 0,
    activeProjects: data?.active_projects ?? 0,
    employees: data?.employees ?? 0,
    overallProgress: data?.overall_progress ?? 0,
  };
}

/** Tasks completed per week, last `weeks` weeks (Mon–Sun buckets), oldest first. */
export async function getCompletionTrend(supabase, weeks = 6) {
  const { data, error } = await supabase.rpc("completion_trend", { p_weeks: weeks });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    start: r.week_start,
    label: format(new Date(r.week_start), "d MMM"),
    completed: r.completed,
  }));
}

/** Active projects grouped by service, for the donut (largest first). */
export async function getProjectsByService(supabase) {
  const { data, error } = await supabase
    .from("projects_by_service_view")
    .select("id, name, value")
    .order("value", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Top 5 at-risk projects. Scoring (overdue → due ≤7d → behind schedule →
 * on hold) lives in `at_risk_projects_view`; this just takes the 5 worst and
 * re-nests client/service/lead the way the card expects.
 */
export async function getAtRiskProjects(supabase, limit = 5) {
  const { data, error } = await supabase
    .from("at_risk_projects_view")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    progress_percent: p.progress_percent,
    due_date: p.due_date,
    daysLeft: p.days_left,
    reason: p.reason,
    client: p.client_name ? { company_name: p.client_name } : null,
    service: p.service_title ? { title: p.service_title } : null,
    lead: p.lead_name ? { full_name: p.lead_name } : null,
  }));
}
