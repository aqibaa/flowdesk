import { requireAdmin } from "@/lib/auth/guards";
import { getServiceStats, listProjectsForService, listServices } from "@/lib/queries/services";
import { PageHeader } from "@/components/shared/page-header";
import { ServiceCards } from "./service-cards";
import { TemplateEditorPanel } from "./template-editor-panel";

export const metadata = { title: "Services" };

function StatTile({ label, value, unit }) {
  return (
    <div className="px-5 py-3 first:pl-0 last:pr-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold leading-none">
        {value} <span className="text-sm font-medium text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

export default async function ServicesPage({ searchParams }) {
  const sp = await searchParams;
  const selectedId = typeof sp.service === "string" ? sp.service : null;

  const { supabase } = await requireAdmin();
  const [stats, services] = await Promise.all([getServiceStats(supabase), listServices(supabase)]);
  const selected = services.find((s) => s.id === selectedId) ?? null;
  const selectedProjects = selected ? await listProjectsForService(supabase, selected.id) : [];

  return (
    <>
      <PageHeader
        eyebrow="Service catalogue"
        title="Services"
        description="Standardised service offerings and the template tasks copied into every new project."
        actions={
          <div className="flex items-center divide-x rounded-2xl border bg-card px-5 shadow-soft">
            <StatTile label="Published" value={stats.services} unit="services" />
            <StatTile label="Template tasks" value={stats.templateTasks} unit="pre-defined" />
            <StatTile label="Active" value={stats.activeProjects} unit="projects" />
          </div>
        }
      />

      <div className={selected ? "grid gap-6 xl:grid-cols-[1fr_400px]" : ""}>
        <div className="min-w-0">
          <ServiceCards services={services} selectedId={selected?.id ?? null} />
        </div>
        {selected && (
          <TemplateEditorPanel
            key={selected.id}
            service={selected}
            projects={selectedProjects}
          />
        )}
      </div>
    </>
  );
}
