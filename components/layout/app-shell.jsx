import { listMyNotifications } from "@/lib/queries/notifications";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { NotificationToaster } from "@/components/layout/notification-toaster";

/**
 * Shared chrome for both portals: sidebar + top bar + page area.
 * Server Component — receives the already-verified profile and the
 * request-bound Supabase client from the layout. Only plain data crosses
 * to the client components.
 */
export async function AppShell({ profile, supabase, children }) {
  const plainProfile = {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role,
    job_title: profile.job_title,
  };

  // Notifications are fetched once per request for the bell (no polling).
  const notifications = await listMyNotifications(supabase, 10);

  // `portal-employee` swaps the primary/accent tokens to blue (globals.css).
  const portalClass = profile.role === "employee" ? "portal-employee" : "";

  return (
    <div className={`flex min-h-screen bg-background ${portalClass}`}>
      <Sidebar profile={plainProfile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar profile={plainProfile} notifications={notifications} />
        {/* Live toast for each new notification (Realtime push, no polling). */}
        <NotificationToaster userId={profile.id} role={profile.role} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
