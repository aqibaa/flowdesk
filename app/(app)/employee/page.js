import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata = { title: "My Dashboard" };

export default function Page() {
  return <ComingSoon title="My Dashboard" description="Your open tasks, what is due soon and what you completed this week." phase={6} />;
}
