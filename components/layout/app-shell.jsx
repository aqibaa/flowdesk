import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

/**
 * Shared chrome for both portals: sidebar + top bar + page area.
 * Server Component — receives the already-verified profile from the layout.
 * Only plain data crosses to the client components; they derive the nav
 * (icon components included) from `profile.role` via lib/navigation.js.
 */
export function AppShell({ profile, children }) {
  const plainProfile = {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role,
    job_title: profile.job_title,
  };

  // `portal-employee` swaps the primary/accent tokens to blue (globals.css).
  const portalClass = profile.role === "employee" ? "portal-employee" : "";

  return (
    <div className={`flex min-h-screen bg-background ${portalClass}`}>
      <Sidebar profile={plainProfile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar profile={plainProfile} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
