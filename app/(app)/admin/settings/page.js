import { BellIcon, KeyRoundIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { listProfiles } from "@/lib/queries/team";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsSection } from "@/components/shared/settings-section";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/forms/profile-form";
import { PasswordForm } from "@/components/forms/password-form";
import { NotificationPrefsForm } from "@/components/forms/notification-prefs-form";
import { RolesAccess } from "./roles-access";
import { SettingsTabs } from "./settings-tabs";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const { supabase, profile } = await requireAdmin();
  const users = await listProfiles(supabase);

  return (
    <>
      <PageHeader
        eyebrow="Workspace configuration"
        title="Settings"
        description="Manage your personal profile, workspace access roles and alert preferences."
      />

      <SettingsTabs
        tabs={[
          { id: "profile", label: "Profile", icon: "user" },
          { id: "roles", label: "Roles & Access", icon: "shield", badge: users.length },
          { id: "notifications", label: "Notifications", icon: "bell" },
        ]}
      />

      <div className="space-y-6">
        <SettingsSection
          id="profile"
          icon={UserIcon}
          title="Profile"
          description="Your name and title as shown across FlowDesk."
          aside={<Badge variant="completed">Verified</Badge>}
        >
          <ProfileForm profile={profile} />
        </SettingsSection>

        <SettingsSection id="password" icon={KeyRoundIcon} title="Password" description="Choose a new password for your account.">
          <PasswordForm />
        </SettingsSection>

        <SettingsSection
          id="roles"
          icon={ShieldCheckIcon}
          title="Roles & Access"
          description="Assign Admin or Employee to each team member."
          aside={<Badge variant="secondary">{users.length} users</Badge>}
        >
          <RolesAccess users={users} currentUserId={profile.id} />
        </SettingsSection>

        <SettingsSection id="notifications" icon={BellIcon} title="Notifications" description="Configure email and in-app alerts for operational events.">
          <NotificationPrefsForm stored={profile.notification_prefs} />
        </SettingsSection>
      </div>
    </>
  );
}
