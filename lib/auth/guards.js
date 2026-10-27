import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

/**
 * Route guards for Server Components (layouts/pages). They redirect.
 * For Server Actions use the throwing variants in ./action-guards.js.
 */

/** Any signed-in, active user. Inactive users are bounced to /login. */
export async function requireUser() {
  const { supabase, profile } = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/login?error=inactive");
  return { supabase, profile };
}

/** Admin only. Employees are sent to their own portal, not an error page. */
export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.profile.role !== "admin") redirect("/employee");
  return ctx;
}

/** The home route for a role — used by /dashboard and after login. */
export function homePathForRole(role) {
  return role === "admin" ? "/admin" : "/employee";
}
