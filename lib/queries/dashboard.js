import { format, startOfWeek, subWeeks } from "date-fns";

/** Admin dashboard reads (request-bound client from requireAdmin()). */

/** 4 KPI tiles. Overall progress = mean progress of active projects. */
export async function getDashboardKpis(supabase) {
  const [clients, active, employees, progress] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "employee").eq("is_active", true),
    supabase.from("projects").select("progress_percent").eq("status", "active"),
  ]);
  for (const r of [clients, active, employees, progress]) if (r.error) throw r.error;
  const list = progress.data ?? [];
  const overall = list.length ? Math.round(list.reduce((s, p) => s + p.progress_percent, 0) / list.length) : 0;
  return {
    clients: clients.count ?? 0,
    activeProjects: active.count ?? 0,
    employees: employees.count ?? 0,
    overallProgress: overall,
  };
}

/** Tasks completed per week, last `weeks` weeks (Mon–Sun buckets). */
export async function getCompletionTrend(supabase, weeks = 6, now = new Date()) {
  const since = startOfWeek(subWeeks(now, weeks - 1), { weekStartsOn: 1 });
  const { data, error } = await supabase
    .from("tasks")
    .select("completed_at")
    .eq("status", "completed")
    .gte("completed_at", since.toISOString());
  if (error) throw error;

  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    buckets.push({ start: format(start, "yyyy-MM-dd"), label: format(start, "d MMM"), completed: 0 });
  }
  for (const t of data ?? []) {
    const day = t.completed_at.slice(0, 10);
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (day >= buckets[i].start) {
        buckets[i].completed += 1;
        break;
      }
    }
  }
  return buckets;
}

/** Active projects grouped by service, for the donut. */
export async function getProjectsByService(supabase) {
  const { data, error } = await supabase
    .from("projects")
    .select("service:services(id, title)")
    .eq("status", "active");
  if (error) throw error;
  const map = new Map();
  for (const p of data ?? []) {
    const key = p.service?.id ?? "none";
    const cur = map.get(key) ?? { id: key, name: p.service?.title ?? "No service", value: 0 };
    cur.value += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
}

/**
 * Top 5 at-risk projects: active/on-hold ones that are overdue, due within
 * 7 days, or progressing slowly relative to elapsed time. Scored, then the
 * 5 worst are returned with a reason label.
 */
export async function getAtRiskProjects(supabase, now = new Date()) {
  const today = format(now, "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, progress_percent, start_date, due_date, client:clients(company_name), service:services(title), lead:profiles!projects_lead_id_fkey(full_name)")
    .in("status", ["active", "on_hold"])
    .not("due_date", "is", null);
  if (error) throw error;

  const scored = [];
  for (const p of data ?? []) {
    const due = new Date(p.due_date);
    const daysLeft = Math.round((due - now) / 86400000);
    let elapsedPct = null;
    if (p.start_date) {
      const start = new Date(p.start_date);
      const span = Math.max(1, (due - start) / 86400000);
      elapsedPct = Math.min(100, Math.max(0, Math.round((100 * (now - start)) / 86400000 / span)));
    }
    let reason = null;
    let score = 0;
    if (p.due_date < today && p.progress_percent < 100) {
      reason = `Overdue by ${-daysLeft}d`;
      score = 1000 - daysLeft;
    } else if (daysLeft <= 7) {
      reason = daysLeft === 0 ? "Due today" : `Due in ${daysLeft}d`;
      score = 500 - daysLeft * 10 + (100 - p.progress_percent);
    } else if (elapsedPct !== null && elapsedPct - p.progress_percent >= 25) {
      reason = `Behind schedule (${elapsedPct}% time, ${p.progress_percent}% done)`;
      score = 100 + (elapsedPct - p.progress_percent);
    } else if (p.status === "on_hold") {
      reason = "On hold";
      score = 50;
    }
    if (reason) scored.push({ ...p, reason, daysLeft, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}
