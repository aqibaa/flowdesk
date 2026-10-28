/**
 * Server-side reads for Services (admin). Pass a request-bound client.
 */

/** All services with their ordered template tasks and project counts. */
export async function listServices(supabase) {
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, title, description, is_published, created_at, template_tasks:service_template_tasks(id, title, description, estimated_hours, position), projects(id, status)"
    )
    .order("title", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((s) => {
    const tasks = (s.template_tasks ?? []).sort((a, b) => a.position - b.position);
    const projects = s.projects ?? [];
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      is_published: s.is_published,
      created_at: s.created_at,
      template_tasks: tasks,
      template_hours: tasks.reduce((sum, t) => sum + Number(t.estimated_hours ?? 0), 0),
      project_count: projects.length,
      active_project_count: projects.filter((p) => p.status === "active").length,
    };
  });
}

/** KPI figures for the header tiles. */
export async function getServiceStats(supabase) {
  const [{ count: services }, { count: templateTasks }, { count: activeProjects }] = await Promise.all([
    supabase.from("services").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("service_template_tasks").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  return {
    services: services ?? 0,
    templateTasks: templateTasks ?? 0,
    activeProjects: activeProjects ?? 0,
  };
}

/** Projects created from one service (for the editor's side list). */
export async function listProjectsForService(supabase, serviceId, limit = 5) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, progress_percent, client:clients(company_name)")
    .eq("service_id", serviceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
