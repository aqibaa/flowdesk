import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "My Tasks" };

export default function Page() {
  return <ComingSoon title="My Tasks" description="Everything assigned to you, grouped by client and project." phase={6} />;
}
