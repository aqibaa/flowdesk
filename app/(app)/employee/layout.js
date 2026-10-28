import { requireUser } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";

/** Any active signed-in user (admins may look at the employee portal too). */
export default async function EmployeeLayout({ children }) {
  const { supabase, profile } = await requireUser();
  return <AppShell profile={profile} supabase={supabase}>{children}</AppShell>;
}
