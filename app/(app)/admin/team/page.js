import { AlertTriangleIcon, GaugeIcon, UsersIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { getTeamStats, listProfiles } from "@/lib/queries/team";
import { parseQuery } from "@/lib/search-params";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { InviteEmployeeDialog } from "@/components/forms/invite-employee-dialog";
import { TeamTable } from "./team-table";

export const metadata = { title: "Team" };

export default async function TeamPage({ searchParams }) {
  const sp = await searchParams;
  const q = parseQuery(sp.q);

  const { supabase, profile } = await requireAdmin();
  const [stats, profiles] = await Promise.all([getTeamStats(supabase), listProfiles(supabase, { q })]);

  return (
    <>
      <PageHeader
        eyebrow="Workspace admin"
        title="Team"
        description="Directory of team members, capacity allocation and active workload status."
        actions={<InviteEmployeeDialog />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Active employees" value={stats.employees} icon={UsersIcon} tone="blue" footnote="Can be assigned tasks" />
        <KpiCard
          label="Avg workload"
          value={`${stats.avgWorkload}%`}
          icon={GaugeIcon}
          tone={stats.avgWorkload > 85 ? "rose" : "emerald"}
          footnote="Estimated hours due this week ÷ 40h"
        />
        <KpiCard label="High load" value={stats.overloaded} icon={AlertTriangleIcon} tone="rose" footnote="Above 85% capacity" />
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-3 shadow-soft">
          <SearchInput placeholder="Search by name, email or role…" />
        </div>
        {profiles.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={q ? "No team members match" : "No team members yet"}
            description={q ? "Try a different search." : "Invite your first employee to get started."}
            action={!q && <InviteEmployeeDialog />}
          />
        ) : (
          <TeamTable profiles={profiles} currentUserId={profile.id} />
        )}
      </div>
    </>
  );
}
