import { PAGE_SIZE } from "@/lib/constants";
import { ilikePattern, pageRange } from "@/lib/search-params";

const LIST_SELECT =
  "id, name, status, progress_percent, start_date, due_date, created_at, client:clients(id, company_name), service:services(id, title), lead:profiles!projects_lead_id_fkey(id, full_name)";

/**
 * Paginated projects with optional search and filters. Filters are URL
 * params: q, status, service, client.
 * @returns {Promise<{ rows: object[], total: number }>}
 */
export async function listProjects(supabase, { page = 1, q = "", status, service, client } = {}) {
  const { from, to } = pageRange(page, PAGE_SIZE);

  let query = supabase
    .from("projects")
    .select(LIST_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("name", ilikePattern(q));
  if (status) query = query.eq("status", status);
  if (service) query = query.eq("service_id", service);
  if (client) query = query.eq("client_id", client);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

/** KPI tiles: total, active, pending (awaiting activation). */
export async function getProjectStats(supabase) {
  const [{ count: total }, { count: active }, { count: pending }] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return { total: total ?? 0, active: active ?? 0, pending: pending ?? 0 };
}

/** Dropdown options for filters and the project form. */
export async function getProjectFormOptions(supabase) {
  const [clients, services, leads] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"),
    supabase.from("services").select("id, title, is_published").order("title"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);
  for (const r of [clients, services, leads]) if (r.error) throw r.error;
  return {
    clients: clients.data ?? [],
    services: services.data ?? [],
    leads: leads.data ?? [],
  };
}

/** Full project for the detail page, including its tasks and client. */
export async function getProjectDetail(supabase, id) {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `id, name, status, progress_percent, start_date, due_date, created_at, updated_at,
       client:clients(id, company_name, contact_name, email, phone, notes),
       service:services(id, title),
       lead:profiles!projects_lead_id_fkey(id, full_name, job_title),
       tasks(id, task_number, title, status, priority, due_date, estimated_hours, position, assignee:profiles!tasks_assignee_id_fkey(id, full_name))`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  data.tasks = (data.tasks ?? []).sort(
    (a, b) => a.position - b.position || a.task_number - b.task_number
  );
  // Counts per status for the summary strip.
  data.task_counts = data.tasks.reduce(
    (acc, t) => ({ ...acc, [t.status]: (acc[t.status] ?? 0) + 1 }),
    { todo: 0, in_progress: 0, in_review: 0, completed: 0 }
  );
  // Number of template tasks the service would copy on activation.
  const { count } = await supabase
    .from("service_template_tasks")
    .select("id", { count: "exact", head: true })
    .eq("service_id", data.service.id);
  data.template_task_count = count ?? 0;
  return data;
}

/** Recent activity rows for a project (detail page sidebar). */
export async function listProjectActivity(supabase, projectId, limit = 15) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, action, meta, created_at, actor:profiles!activity_log_actor_id_fkey(full_name), task:tasks(task_number, title)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
