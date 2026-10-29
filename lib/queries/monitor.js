import { addDays, format, startOfWeek } from "date-fns";
import { FULL_WORKLOAD_HOURS } from "@/lib/constants";

/** Global Monitor reads. */

/** KPI strip: active projects, at-risk (overdue + due ≤7d), team load %. */
export async function getMonitorKpis(supabase, now = new Date()) {
  const today = format(now, "yyyy-MM-dd");
  const in7 = format(addDays(now, 7), "yyyy-MM-dd");
  const [active, overdue, soon, workload] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active").lt("due_date", today),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active").gte("due_date", today).lte("due_date", in7),
    supabase.from("employee_workload_view").select("hours_due_this_week, is_active").eq("is_active", true),
  ]);
  for (const r of [active, overdue, soon, workload]) if (r.error) throw r.error;
  const people = workload.data ?? [];
  const hours = people.reduce((s, p) => s + Number(p.hours_due_this_week ?? 0), 0);
  const capacity = people.length * FULL_WORKLOAD_HOURS;
  return {
    activeProjects: active.count ?? 0,
    atRisk: (overdue.count ?? 0) + (soon.count ?? 0),
    overdue: overdue.count ?? 0,
    teamLoadPercent: capacity ? Math.round((100 * hours) / capacity) : 0,
    plannedHours: Math.round(hours),
    capacityHours: capacity,
    overloaded: people.filter((p) => Number(p.hours_due_this_week) > FULL_WORKLOAD_HOURS).length,
  };
}

/**
 * Top 5 active projects (soonest due first) with their task pipeline
 * (tasks in position order with status) and distinct assignees.
 */
export async function getTopProjects(supabase, limit = 5) {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, status, progress_percent, due_date, client:clients(company_name), service:services(title), lead:profiles!projects_lead_id_fkey(id, full_name), tasks(id, title, status, position, assignee:profiles!tasks_assignee_id_fkey(id, full_name))"
    )
    .eq("status", "active")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((p) => {
    const tasks = (p.tasks ?? []).sort((a, b) => a.position - b.position);
    const assignees = [...new Map(tasks.filter((t) => t.assignee).map((t) => [t.assignee.id, t.assignee])).values()];
    return { ...p, tasks, assignees };
  });
}

/**
 * Workload heatmap for the current week (Mon–Fri): estimated hours of
 * open tasks due each day, per active employee, plus weekly totals from
 * employee_workload_view.
 */
export async function getWorkloadHeatmap(supabase, now = new Date()) {
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }, (_, i) => format(addDays(monday, i), "yyyy-MM-dd"));

  // workload_heatmap_view (migration 14) is already summed per person per day.
  const [people, cells] = await Promise.all([
    supabase.from("employee_workload_view").select("id, full_name, job_title, open_task_count, overdue_task_count, hours_due_this_week, workload_percent").eq("is_active", true).order("full_name"),
    supabase
      .from("workload_heatmap_view")
      .select("assignee_id, due_date, hours")
      .gte("due_date", days[0])
      .lte("due_date", days[4]),
  ]);
  if (people.error) throw people.error;
  if (cells.error) throw cells.error;

  const byPerson = new Map();
  for (const c of cells.data ?? []) {
    const row = byPerson.get(c.assignee_id) ?? {};
    row[c.due_date] = Number(c.hours ?? 0);
    byPerson.set(c.assignee_id, row);
  }

  return {
    days: days.map((d) => ({ date: d, label: format(new Date(d), "EEE") })),
    rows: (people.data ?? []).map((p) => ({
      ...p,
      hours_due_this_week: Number(p.hours_due_this_week ?? 0),
      daily: days.map((d) => byPerson.get(p.id)?.[d] ?? 0),
    })),
  };
}
