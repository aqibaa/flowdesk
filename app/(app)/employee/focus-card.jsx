import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";
import { formatTaskKey } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DueDate } from "@/components/shared/due-date";

const PRIORITY_DOT = {
  urgent: "bg-rose-500",
  high: "bg-orange-500",
  medium: "bg-sky-500",
  low: "bg-slate-400",
};

/** "Today's focus": overdue → due today → in-progress/urgent, max 4. */
export function FocusCard({ focus, overdueCount, dueTodayCount }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <SparklesIcon className="size-4" />
        </span>
        <div>
          <h2 className="font-heading font-semibold">Today&apos;s focus</h2>
          <p className="text-xs text-muted-foreground">
            {overdueCount > 0 && <span className="font-medium text-rose-600 dark:text-rose-400">{overdueCount} overdue · </span>}
            {dueTodayCount} due today
          </p>
        </div>
      </div>

      {focus.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Nothing urgent. Pick the next task from your list.
        </p>
      ) : (
        <ul className="divide-y">
          {focus.map((t) => (
            <li key={t.id}>
              <Link
                href={`/employee/tasks?task=${t.id}`}
                className="flex items-center gap-3 py-2.5 transition hover:bg-muted/40 -mx-2 rounded-lg px-2"
              >
                <span className={`size-2.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} title={TASK_PRIORITY_LABELS[t.priority]} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatTaskKey(t.task_number)} · {t.client_company_name} · {t.project_name}
                  </p>
                </div>
                <Badge variant={t.status}>{TASK_STATUS_LABELS[t.status]}</Badge>
                <DueDate date={t.due_date} className="hidden sm:inline-flex" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
