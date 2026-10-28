import { PAGE_SIZE } from "@/lib/constants";
import { ilikePattern, pageRange } from "@/lib/search-params";

/**
 * Server-side reads for Clients. All take a request-bound Supabase client
 * from requireAdmin() so RLS applies.
 */

/**
 * Paginated client list with per-client project counts and average progress.
 * @returns {Promise<{ rows: object[], total: number }>}
 */
export async function listClients(supabase, { page = 1, q = "" } = {}) {
  const { from, to } = pageRange(page, PAGE_SIZE);

  let query = supabase
    .from("clients")
    .select(
      "id, company_name, contact_name, email, phone, created_at, projects(id, status, progress_percent, service:services(title))",
      { count: "exact" }
    )
    .order("company_name", { ascending: true })
    .range(from, to);

  if (q) {
    const pattern = ilikePattern(q);
    query = query.or(
      `company_name.ilike.${pattern},contact_name.ilike.${pattern},email.ilike.${pattern}`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []).map((c) => {
    const projects = c.projects ?? [];
    const active = projects.filter((p) => p.status === "active");
    const avg =
      projects.length === 0
        ? null
        : Math.round(projects.reduce((s, p) => s + (p.progress_percent ?? 0), 0) / projects.length);
    // Distinct service titles for the "services purchased" chips.
    const services = [...new Set(projects.map((p) => p.service?.title).filter(Boolean))];
    return {
      ...c,
      project_count: projects.length,
      active_project_count: active.length,
      avg_progress: avg,
      services,
    };
  });

  return { rows, total: count ?? 0 };
}

/** KPI figures for the header tiles. */
export async function getClientStats(supabase) {
  const [{ count: clients }, { count: activeProjects }] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  return { clients: clients ?? 0, activeProjects: activeProjects ?? 0 };
}

/** One client with its projects (for the detail drawer). */
export async function getClientDetail(supabase, id) {
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, company_name, contact_name, email, phone, notes, created_at, updated_at, projects(id, name, status, progress_percent, due_date, service:services(title), lead:profiles!projects_lead_id_fkey(full_name))"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  data.projects = (data.projects ?? []).sort((a, b) => a.name.localeCompare(b.name));
  return data;
}
