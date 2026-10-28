import { format } from "date-fns";
import { AlertTriangleIcon, FolderKanbanIcon, GaugeIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { getMonitorKpis, getTopProjects, getWorkloadHeatmap } from "@/lib/queries/monitor";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { RefreshButton } from "./refresh-button";
import { ProjectMonitorCard } from "./project-monitor-card";
import { WorkloadHeatmap } from "./workload-heatmap";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Global Monitor" };

export default async function MonitorPage() {
  const { supabase } = await requireAdmin();
  const now = new Date();
  const [kpis, projects, heatmap] = await Promise.all([
    getMonitorKpis(supabase, now),
    getTopProjects(supabase, 5),
    getWorkloadHeatmap(supabase, now),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Global monitor"
        title="Global Monitor"
        description="High-level view of client delivery, bottlenecks and team bandwidth. No auto-refresh — use the button."
        actions={<RefreshButton updatedAt={format(now, "HH:mm")} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Active projects" value={kpis.activeProjects} icon={FolderKanbanIcon} footnote="In delivery right now" />
        <KpiCard
          label="At-risk projects"
          value={kpis.atRisk}
          icon={AlertTriangleIcon}
          tone="rose"
          footnote={kpis.overdue > 0 ? `${kpis.overdue} overdue · rest due within 7 days` : "Due within 7 days"}
        />
        <KpiCard
          label="Team load"
          value={`${kpis.teamLoadPercent}%`}
          icon={GaugeIcon}
          tone={kpis.teamLoadPercent > 100 ? "rose" : kpis.teamLoadPercent > 80 ? "amber" : "emerald"}
          footnote={`${kpis.plannedHours}h of ${kpis.capacityHours}h planned this week${kpis.overloaded ? ` · ${kpis.overloaded} overloaded` : ""}`}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold">
            Top 5 active projects <span className="ml-1 text-sm font-normal text-muted-foreground">soonest due first</span>
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/projects?status=active">View all projects</Link>
          </Button>
        </div>
        {projects.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No active projects.</p>
        ) : (
          projects.map((p) => <ProjectMonitorCard key={p.id} project={p} />)
        )}
      </section>

      <WorkloadHeatmap days={heatmap.days} rows={heatmap.rows} />
    </div>
  );
}
