import { addDays, format, startOfWeek, subWeeks } from "date-fns";

/**
 * Employee reads. Everything goes through employee_tasks_view (filtered to
 * auth.uid() inside the DB) or RLS-guarded tables, so these helpers never
 * need an assignee filter themselves.
 */

const ROW =
  "id, task_number, project_id, title, status, priority, due_date, estimated_hours, position, created_at, completed_at, project_name, project_status, project_progress_percent, client_id, client_company_name, service_title, subtask_total, subtask_done, comment_count, project_task_total, project_task_done";

/** All of my tasks (open first, then completed), for the grouped list/board. */
export async function listMyTasks(supabase) {
  const { data, error } = await supabase
    .from("employee_tasks_view")
    .select(ROW)
    .order("client_company_name")
    .order("project_name")
    .order("position")
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

/** Group rows: client → project → tasks. Preserves the query order. */
export function groupMyTasks(rows) {
  const clients = new Map();
  for (const t of rows) {
    if (!clients.has(t.client_id)) {
      clients.set(t.client_id, { id: t.client_id, name: t.client_company_name, projects: new Map() });
    }
    const c = clients.get(t.client_id);
    if (!c.projects.has(t.project_id)) {
      c.projects.set(t.project_id, {
        id: t.project_id,
        name: t.project_name,
        service: t.service_title,
        status: t.project_status,
        progress: t.project_progress_percent,
        task_total: t.project_task_total,
        task_done: t.project_task_done,
        due_date: t.project_due_date,
        tasks: [],
      });
    }
    c.projects.get(t.project_id).tasks.push(t);
  }
  return [...clients.values()].map((c) => ({ ...c, projects: [...c.projects.values()] }));
}

/** Dashboard numbers + lists, derived from one fetch of my tasks. */
export function summariseMyTasks(rows, now = new Date()) {
  const today = format(now, "yyyy-MM-dd");
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const in7 = format(addDays(now, 7), "yyyy-MM-dd");

  const open = rows.filter((t) => t.status !== "completed");
  const completedThisWeek = rows.filter(
    (t) => t.status === "completed" && t.completed_at && t.completed_at.slice(0, 10) >= weekStart
  );
  const overdue = open.filter((t) => t.due_date && t.due_date < today);
  const dueToday = open.filter((t) => t.due_date === today);
  const upcoming = open
    .filter((t) => t.due_date && t.due_date > today && t.due_date <= in7)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  // "Today's focus": overdue first, then due today, then in-progress/urgent.
  const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 };
  const focus = [...overdue, ...dueToday];
  for (const t of open) {
    if (focus.length >= 4) break;
    if (!focus.includes(t) && (t.status === "in_progress" || t.priority === "urgent")) focus.push(t);
  }
  focus.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  return {
    counts: {
      todo: open.filter((t) => t.status === "todo").length,
      in_progress: open.filter((t) => t.status === "in_progress").length,
      in_review: open.filter((t) => t.status === "in_review").length,
      completed_this_week: completedThisWeek.length,
    },
    overdue,
    dueToday,
    upcoming: upcoming.slice(0, 6),
    focus: focus.slice(0, 4),
  };
}

/** Tasks completed per ISO week for the last `weeks` weeks (chart data). */
export function weeklyCompletions(rows, weeks = 6, now = new Date()) {
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    buckets.push({ start: format(start, "yyyy-MM-dd"), label: format(start, "d MMM"), completed: 0 });
  }
  for (const t of rows) {
    if (t.status !== "completed" || !t.completed_at) continue;
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

/** Drawer payload: view row + subtasks + comments (RLS limits both to my tasks). */
export async function getMyTaskDetail(supabase, id) {
  const [{ data: task, error }, { data: subtasks }, { data: comments }] = await Promise.all([
    supabase.from("employee_tasks_view").select(`${ROW}, description`).eq("id", id).maybeSingle(),
    supabase.from("task_subtasks").select("id, title, is_done, position").eq("task_id", id).order("position"),
    supabase
      .from("my_task_comments_view")
      .select("id, body, created_at, author_id, author_name")
      .eq("task_id", id)
      .order("created_at"),
  ]);
  if (error) throw error;
  if (!task) return null;
  // Same shape as the admin drawer's comments so CommentsSection is reusable.
  const shaped = (comments ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author: { id: c.author_id, full_name: c.author_name },
  }));
  return { ...task, subtasks: subtasks ?? [], comments: shaped };
}
