import Link from "next/link";
import { format, parseISO } from "date-fns";
import { formatTaskKey } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TASK_PRIORITY_LABELS } from "@/lib/constants";

function Row({ task, tone }) {
  return (
    <li>
      <Link href={`/employee/tasks?task=${task.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted/40 -mx-2">
        <div className={`flex w-12 shrink-0 flex-col items-center rounded-lg py-1 ${tone}`}>
          <span className="text-[10px] font-semibold uppercase">{format(parseISO(task.due_date), "MMM")}</span>
          <span className="font-heading text-lg font-bold leading-none">{format(parseISO(task.due_date), "d")}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{task.title}</p>
          <p className="truncate text-xs text-muted-foreground">{formatTaskKey(task.task_number)} · {task.project_name}</p>
        </div>
        <Badge variant={task.priority}>{TASK_PRIORITY_LABELS[task.priority]}</Badge>
      </Link>
    </li>
  );
}

/** Overdue + next 7 days. */
export function DeadlinesCard({ upcoming, overdue, icon: Icon }) {
  return (
    <aside className="h-fit rounded-2xl border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
        <h2 className="font-heading font-semibold">Upcoming deadlines</h2>
      </div>

      {overdue.length === 0 && upcoming.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          No deadlines in the next 7 days.
        </p>
      ) : (
        <>
          {overdue.length > 0 && (
            <>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">Overdue</p>
              <ul className="mb-3 divide-y">
                {overdue.slice(0, 4).map((t) => (
                  <Row key={t.id} task={t} tone="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" />
                ))}
              </ul>
            </>
          )}
          {upcoming.length > 0 && (
            <>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Next 7 days</p>
              <ul className="divide-y">
                {upcoming.map((t) => (
                  <Row key={t.id} task={t} tone="bg-accent text-accent-foreground" />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </aside>
  );
}
