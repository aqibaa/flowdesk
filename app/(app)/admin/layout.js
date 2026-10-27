import { requireAdmin } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Every /admin/* route renders inside this layout, so the admin check runs
 * for all of them. An employee is redirected to /employee (see requireAdmin).
 * Server Actions re-check independently (requireAdminAction) because a
 * layout is not a security boundary for mutations.
 */
export default async function AdminLayout({ children }) {
  const { profile } = await requireAdmin();
  return <AppShell profile={profile}>{children}</AppShell>;
}
