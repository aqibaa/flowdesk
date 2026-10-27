import { UsersIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { listProfiles } from "@/lib/queries/team";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InviteEmployeeDialog } from "@/components/forms/invite-employee-dialog";
import { TeamTable } from "./team-table";

export const metadata = { title: "Team" };

/**
 * Team roster + invite flow. Phase 7 adds the workload meter from
 * employee_workload_view; this version ships the auth-related parts.
 */
export default async function TeamPage() {
  const { supabase, profile } = await requireAdmin();
  const profiles = await listProfiles(supabase);

  return (
    <>
      <PageHeader
        eyebrow="Team & workload"
        title="Team"
        description="Invite employees, set roles and deactivate accounts. Workload meters arrive with the dashboard phase."
        actions={<InviteEmployeeDialog />}
      />
      {profiles.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No team members yet"
          description="Invite your first employee to get started."
          action={<InviteEmployeeDialog />}
        />
      ) : (
        <TeamTable profiles={profiles} currentUserId={profile.id} />
      )}
    </>
  );
}
