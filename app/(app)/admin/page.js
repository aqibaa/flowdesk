import { format } from "date-fns";
import { BuildingIcon, FolderKanbanIcon, GaugeIcon, UsersIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getAtRiskProjects,
  getCompletionTrend,
  getDashboardKpis,
  getProjectsByService,
} from "@/lib/queries/dashboard";
import { KpiCard } from "@/components/shared/kpi-card";
import { DashboardChartsLoader } from "./dashboard-charts-loader";
import { AtRiskCard } from "./at-risk-card";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const { supabase, profile } = await requireAdmin();
  const [kpis, trend, byService, atRisk] = await Promise.all([
    getDashboardKpis(supabase),
    getCompletionTrend(supabase, 6),
    getProjectsByService(supabase),
    getAtRiskProjects(supabase),
  ]);
  const firstName = profile.full_name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back{firstName ? `, ${firstName}` : ""}. Overview of active projects and delivery as of {format(now, "d MMM yyyy")}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total clients" value={kpis.clients} icon={BuildingIcon} tone="emerald" footnote="Registered accounts" />
        <KpiCard label="Active projects" value={kpis.activeProjects} icon={FolderKanbanIcon} footnote={`${byService.length} service line${byService.length === 1 ? "" : "s"}`} />
        <KpiCard label="Employees" value={kpis.employees} icon={UsersIcon} tone="blue" footnote="Active team members" />
        <KpiCard label="Overall progress" value={`${kpis.overallProgress}%`} icon={GaugeIcon} tone="amber" footnote="Average of active projects" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <DashboardChartsLoader trend={trend} byService={byService} activeTotal={kpis.activeProjects} />
        <AtRiskCard projects={atRisk} />
      </div>
    </div>
  );
}
