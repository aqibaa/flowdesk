import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { navForRole } from "@/lib/navigation";

/**
 * Shared chrome for both portals: sidebar + top bar + page area.
 * Server Component — receives the already-verified profile from the layout.
 * Role-specific items (nav, "+ New Project") derive from profile.role.
 */
export function AppShell({ profile, children }) {
  const nav = navForRole(profile.role);
  const plainProfile = {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role,
    job_title: profile.job_title,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar nav={nav} profile={plainProfile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar nav={nav} profile={plainProfile} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
