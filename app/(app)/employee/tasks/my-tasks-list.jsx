"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ChevronDownIcon, ListChecksIcon } from "lucide-react";
import { toast } from "sonner";
import { useUrlState } from "@/hooks/use-url-state";
import { updateMyTaskStatus } from "@/lib/actions/employee";
import { TASK_PRIORITY_LABELS } from "@/lib/constants";
import { cn, formatTaskKey } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { DueDate } from "@/components/shared/due-date";
import { StatusPillSelect } from "@/components/tasks/status-pill-select";
import { ConfettiBurst } from "@/components/tasks/confetti-burst";

const PRIORITY_DOT = {
  urgent: "bg-rose-500",
  high: "bg-orange-500",
  medium: "bg-sky-500",
  low: "bg-slate-400",
};

/** Optimistic reducer: patch one task's status inside the nested groups. */
function applyStatus(groups, { taskId, status }) {
  return groups.map((c) => ({
    ...c,
    projects: c.projects.map((p) => {
      if (!p.tasks.some((t) => t.id === taskId)) return p;
      const tasks = p.tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
      // Mirror recalc_project_progress() using the project's full task counts
      // (from the view) so the bar animates to the value the DB will store.
      const wasDone = p.tasks.find((t) => t.id === taskId).status === "completed";
      const done = p.task_done + (status === "completed" ? 1 : 0) - (wasDone ? 1 : 0);
      const progress = p.task_total === 0 ? 0 : Math.round((100 * done) / p.task_total);
      return { ...p, tasks, task_done: done, progress };
    }),
  }));
}

function TaskRow({ task, onStatus, pending }) {
  const [burst, setBurst] = useState(false);
  const { set, params } = useUrlState();
  const done = task.status === "completed";

  const change = (status) => {
    if (status === task.status) return;
    if (status === "completed") setBurst(true);
    onStatus(task.id, status);
  };

  return (
    <li className={cn("group flex items-center gap-3 px-4 py-2.5 transition hover:bg-muted/40", done && "opacity-70")}>
      <span className="relative flex items-center">
        <Checkbox
          checked={done}
          disabled={pending}
          aria-label={done ? "Reopen task" : "Mark completed"}
          onCheckedChange={(v) => change(v ? "completed" : "todo")}
          className="size-5 rounded-full data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
        />
        {burst && <ConfettiBurst onDone={() => setBurst(false)} />}
      </span>
      <span className={cn("size-2.5 shrink-0 rounded-full", PRIORITY_DOT[task.priority])} title={TASK_PRIORITY_LABELS[task.priority]} />
      <button
        type="button"
        onClick={() => set({ task: task.id, done: params.get("done") })}
        className="min-w-0 flex-1 text-left"
      >
        <p className={cn("truncate text-sm font-medium", done && "line-through")}>{task.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {formatTaskKey(task.task_number)}
          {task.subtask_total > 0 && ` · ${task.subtask_done}/${task.subtask_total} subtasks`}
          {task.comment_count > 0 && ` · ${task.comment_count} comment${task.comment_count === 1 ? "" : "s"}`}
        </p>
      </button>
      <DueDate date={task.due_date} done={done} className="hidden sm:inline-flex" />
      <StatusPillSelect value={task.status} onChange={change} disabled={pending} />
    </li>
  );
}

function ProjectSection({ project, onStatus, pending }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 bg-muted/30 px-4 py-2.5 text-left"
      >
        <ChevronDownIcon className={cn("size-4 text-muted-foreground transition", !open && "-rotate-90")} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{project.name}</p>
          <p className="text-xs text-muted-foreground">{project.service} · {project.tasks.length} task{project.tasks.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex w-40 items-center gap-2">
          <Progress value={project.progress} className="h-1.5" indicatorClassName="transition-transform duration-700 ease-out" />
          <span className="w-9 text-right text-xs font-semibold text-primary">{project.progress}%</span>
        </div>
      </button>
      {open && (
        <ul className="divide-y">
          {project.tasks.map((t) => (
            <TaskRow key={t.id} task={t} onStatus={onStatus} pending={pending} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function MyTasksList({ groups, showDone, completedCount }) {
  const { set } = useUrlState();
  const [pending, start] = useTransition();
  const [optimistic, patch] = useOptimistic(groups, applyStatus);

  const onStatus = (taskId, status) =>
    start(async () => {
      patch({ taskId, status });
      const res = await updateMyTaskStatus({ task_id: taskId, status });
      if (!res.ok) toast.error(res.message);
      else if (status === "completed") toast.success(res.message);
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => set({ done: showDone ? null : "1" })}>
          {showDone ? "Hide completed" : `Show completed (${completedCount})`}
        </Button>
      </div>

      {optimistic.length === 0 ? (
        <EmptyState
          icon={ListChecksIcon}
          title={showDone ? "No tasks assigned to you" : "All caught up"}
          description={showDone ? "Tasks your admin assigns to you will show up here." : "No open tasks. Nice work."}
        />
      ) : (
        optimistic.map((client) => (
          <section key={client.id} className="overflow-hidden rounded-2xl border bg-card shadow-soft">
            <header className="flex items-center gap-3 border-b px-4 py-3">
              <Avatar name={client.name} size="md" className="rounded-lg" />
              <h2 className="font-heading font-semibold">{client.name}</h2>
              <Badge variant="secondary" className="ml-auto">
                {client.projects.reduce((s, p) => s + p.tasks.length, 0)} tasks
              </Badge>
            </header>
            {client.projects.map((p) => (
              <ProjectSection key={p.id} project={p} onStatus={onStatus} pending={pending} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}
