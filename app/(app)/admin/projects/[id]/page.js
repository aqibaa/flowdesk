import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getProjectDetail, getProjectFormOptions, listProjectActivity } from "@/lib/queries/projects";
import { ProjectHeader } from "./project-header";
import { ProjectTasks } from "./project-tasks";
import { ProjectSidebar } from "./project-sidebar";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("projects").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Project" };
}

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const [project, activity, options] = await Promise.all([
    getProjectDetail(supabase, id),
    listProjectActivity(supabase, id),
    getProjectFormOptions(supabase),
  ]);
  if (!project) notFound();

  // Names for assignee ids inside activity meta.
  const names = Object.fromEntries(options.leads.map((l) => [l.id, l.full_name]));

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} options={options} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <ProjectTasks project={project} />
        <ProjectSidebar project={project} activity={activity} names={names} />
      </div>
    </div>
  );
}
