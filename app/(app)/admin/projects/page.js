import { ClockIcon, FolderKanbanIcon, RefreshCwIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { getProjectFormOptions, getProjectStats, listProjects } from "@/lib/queries/projects";
import { PROJECT_STATUSES } from "@/lib/constants";
import { parseEnum, parsePage, parseQuery } from "@/lib/search-params";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ProjectFormDialog } from "@/components/forms/project-form-dialog";
import { ProjectsFilters } from "./projects-filters";
import { ProjectsTable } from "./projects-table";

export const metadata = { title: "Projects" };

const uuidish = (v) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);

export default async function ProjectsPage({ searchParams }) {
  const sp = await searchParams;
  const filters = {
    page: parsePage(sp.page),
    q: parseQuery(sp.q),
    status: parseEnum(sp.status, PROJECT_STATUSES),
    service: uuidish(sp.service),
    client: uuidish(sp.client),
  };
  const openNew = sp.new === "1";

  const { supabase } = await requireAdmin();
  const [stats, { rows, total }, options] = await Promise.all([
    getProjectStats(supabase),
    listProjects(supabase, filters),
    getProjectFormOptions(supabase),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Delivery pipeline"
        title="Projects"
        description="Client projects created from service templates. Activate a pending project to copy its template tasks."
        actions={<ProjectFormDialog options={options} defaultOpen={openNew} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total projects" value={stats.total} unit="registered" icon={FolderKanbanIcon} />
        <KpiCard label="Active projects" value={stats.active} unit="in delivery" icon={RefreshCwIcon} tone="emerald" />
        <KpiCard label="Pending activation" value={stats.pending} unit="awaiting kickoff" icon={ClockIcon} tone="amber" />
      </div>

      <div className="space-y-4">
        <ProjectsFilters options={options} />
        <ProjectsTable rows={rows} total={total} page={filters.page} options={options} />
      </div>
    </>
  );
}
