import { BellIcon, KeyRoundIcon, UserIcon } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsSection } from "@/components/shared/settings-section";
import { ProfileForm } from "@/components/forms/profile-form";
import { PasswordForm } from "@/components/forms/password-form";
import { NotificationPrefsForm } from "@/components/forms/notification-prefs-form";

export const metadata = { title: "Profile" };

/** Employee settings: own profile, password, notification preferences. */
export default async function EmployeeSettingsPage() {
  const { profile } = await requireUser();

  return (
    <>
      <PageHeader eyebrow="My account" title="Profile" description="Your name, job title, password and notification preferences." />
      <div className="space-y-6">
        <SettingsSection id="profile" icon={UserIcon} title="Profile" description="How you appear to your admin and in comments.">
          <ProfileForm profile={profile} />
        </SettingsSection>
        <SettingsSection id="password" icon={KeyRoundIcon} title="Password" description="Choose a new password for your account.">
          <PasswordForm />
        </SettingsSection>
        <SettingsSection id="notifications" icon={BellIcon} title="Notifications" description="Which events you want to hear about.">
          <NotificationPrefsForm stored={profile.notification_prefs} />
        </SettingsSection>
      </div>
    </>
  );
}
