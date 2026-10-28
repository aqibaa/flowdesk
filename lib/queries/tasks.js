import { KANBAN_COLUMN_LIMIT, PAGE_SIZE, TASK_STATUSES } from "@/lib/constants";
import { ilikePattern, pageRange } from "@/lib/search-params";

const CARD_SELECT =
  "id, task_number, title, status, priority, due_date, estimated_hours, position, created_at, project:projects(id, name, client:clients(company_name)), assignee:profiles!tasks_assignee_id_fkey(id, full_name), subtasks:task_subtasks(id, is_done), comment_count:task_comments(count)";

/** Applies shared filters (project, assignee, priority, q) to a tasks query. */
function applyFilters(query, { project, assignee, priority, q }) {
  if (project) query = query.eq("project_id", project);
  if (assignee === "unassigned") query = query.is("assignee_id", null);
  else if (assignee) query = query.eq("assignee_id", assignee);
  if (priority) query = query.eq("priority", priority);
  if (q) query = query.ilike("title", ilikePattern(q));
  return query;
}

/** Flattens the nested count/subtask embeds into plain numbers. */
function shapeCard(t) {
  const subtasks = t.subtasks ?? [];
  return {
    ...t,
    subtask_total: subtasks.length,
    subtask_done: subtasks.filter((s) => s.is_done).length,
    comment_count: t.comment_count?.[0]?.count ?? 0,
    subtasks: undefined,
  };
}

/**
 * Kanban: one query per column, capped at KANBAN_COLUMN_LIMIT (+ offsets
 * for "Load more", passed as `more` = { status: extraPages }).
 * @returns {Promise<Record<string, { tasks: object[], total: number }>>}
 */
export async function listBoard(supabase, filters, more = {}) {
  const results = await Promise.all(
    TASK_STATUSES.map(async (status) => {
      const limit = KANBAN_COLUMN_LIMIT * (1 + (more[status] ?? 0));
      const { data, error, count } = await applyFilters(
        supabase.from("tasks").select(CARD_SELECT, { count: "exact" }).eq("status", status),
        filters
      )
        .order("position", { ascending: true })
        .order("created_at", { ascending: true })
        .range(0, limit - 1);
      if (error) throw error;
      return [status, { tasks: (data ?? []).map(shapeCard), total: count ?? 0 }];
    })
  );
  return Object.fromEntries(results);
}

/** List view: paginated, newest first, with optional status filter. */
export async function listTasks(supabase, filters, { page = 1, status } = {}) {
  const { from, to } = pageRange(page, PAGE_SIZE);
  let query = applyFilters(
    supabase.from("tasks").select(CARD_SELECT, { count: "exact" }),
    filters
  );
  if (status) query = query.eq("status", status);
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { rows: (data ?? []).map(shapeCard), total: count ?? 0 };
}

/** Everything the drawer needs for one task. */
export async function getTaskDetail(supabase, id) {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `id, task_number, title, description, status, priority, due_date, estimated_hours, created_at, updated_at, completed_at,
       project:projects(id, name, status, client:clients(id, company_name)),
       assignee:profiles!tasks_assignee_id_fkey(id, full_name),
       reporter:profiles!tasks_reporter_id_fkey(id, full_name),
       subtasks:task_subtasks(id, title, is_done, position),
       comments:task_comments(id, body, created_at, author:profiles!task_comments_author_id_fkey(id, full_name))`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  data.subtasks = (data.subtasks ?? []).sort((a, b) => a.position - b.position);
  data.comments = (data.comments ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));

  const { data: activity, error: actError } = await supabase
    .from("activity_log")
    .select("id, action, meta, created_at, actor:profiles!activity_log_actor_id_fkey(full_name)")
    .eq("task_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (actError) throw actError;
  data.activity = activity ?? [];
  return data;
}

/** Dropdown data for the toolbar and forms. */
export async function getTaskOptions(supabase) {
  const [projects, people] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, status, client:clients(company_name)")
      .in("status", ["pending", "active", "on_hold"])
      .order("name"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);
  if (projects.error) throw projects.error;
  if (people.error) throw people.error;
  return { projects: projects.data ?? [], people: people.data ?? [] };
}

/** KPI chips for the page header. */
export async function getTaskStats(supabase, filters) {
  const [{ count: open }, { count: done }] = await Promise.all([
    applyFilters(supabase.from("tasks").select("id", { count: "exact", head: true }).neq("status", "completed"), filters),
    applyFilters(supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "completed"), filters),
  ]);
  return { open: open ?? 0, done: done ?? 0 };
}
