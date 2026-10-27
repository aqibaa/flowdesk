import { redirect } from "next/navigation";

/**
 * Role-based entry point. Phase 2 replaces this placeholder with:
 *   admin -> /admin, employee -> /employee (role read from profiles.role).
 */
export default function DashboardPage() {
  redirect("/login");
}
