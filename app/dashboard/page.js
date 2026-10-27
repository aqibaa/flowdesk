import { redirect } from "next/navigation";
import { requireUser, homePathForRole } from "@/lib/auth/guards";

/** Role router: admin → /admin, employee → /employee (role from profiles.role). */
export default async function DashboardPage() {
  const { profile } = await requireUser();
  redirect(homePathForRole(profile.role));
}
