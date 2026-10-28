import Link from "next/link";
import { format } from "date-fns";
import { CalendarClockIcon, CheckCircle2Icon, CircleDotIcon, ListTodoIcon } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listMyTasks, summariseMyTasks, weeklyCompletions } from "@/lib/queries/employee";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { FocusCard } from "./focus-card";
import { DeadlinesCard } from "./deadlines-card";
import { ProductivityChartLoader } from "./productivity-chart-loader";

export const metadata = { title: "My Dashboard" };

function greeting(date) {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function EmployeeDashboardPage() {
  const { supabase, profile } = await requireUser();
  const rows = await listMyTasks(supabase);
  const now = new Date();
  const summary = summariseMyTasks(rows, now);
  const weekly = weeklyCompletions(rows, 6, now);
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{format(now, "EEEE, d MMMM yyyy")}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {greeting(now)}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here is what is on your plate. Only tasks assigned to you appear here.
          </p>
        </div>
        <Button asChild>
          <Link href="/employee/tasks">
            <ListTodoIcon /> Open my tasks
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="To-Do" value={summary.counts.todo} unit="tasks" icon={ListTodoIcon} tone="blue" footnote="Not started yet" />
        <KpiCard label="In Progress" value={summary.counts.in_progress + summary.counts.in_review} unit="tasks" icon={CircleDotIcon} tone="amber" footnote={`${summary.counts.in_review} waiting for review`} />
        <KpiCard label="Completed this week" value={summary.counts.completed_this_week} unit="tasks" icon={CheckCircle2Icon} tone="emerald" footnote="Since Monday" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <FocusCard focus={summary.focus} overdueCount={summary.overdue.length} dueTodayCount={summary.dueToday.length} />
          <ProductivityChartLoader data={weekly} />
        </div>
        <DeadlinesCard upcoming={summary.upcoming} overdue={summary.overdue} icon={CalendarClockIcon} />
      </div>
    </div>
  );
}
