import { redirect } from "next/navigation";

/** The root has no content of its own; /dashboard routes by role. */
export default function RootPage() {
  redirect("/dashboard");
}
