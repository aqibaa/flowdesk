import Link from "next/link";
import { CheckCircle2Icon, CircleDotIcon, CircleIcon, LayersIcon } from "lucide-react";
import { TASK_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DueDate } from "@/components/shared/due-date";

/** One step of the "delivery phase pipeline" = one task, in position order. */
function PipelineStep({ task }) {
  const done = task.status === "completed";
  const current = task.status === "in_progress" || task.status === "in_review";
  const Icon = done ? CheckCircle2Icon : current ? CircleDotIcon : CircleIcon;
  return (
    <li
      className={cn(
        "flex min-w-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs",
        done && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        current && "border-primary/50 bg-accent text-accent-foreground font-medium",
        !done && !current && "text-muted-foreground"
      )}
      title={`${task.title} — ${TASK_STATUS_LABELS[task.status]}`}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{task.title}</span>
    </li>
  );
}

export function ProjectMonitorCard({ project }) {
  const overdue = project.due_date && project.due_date < new Date().toISOString().slice(0, 10);
  const done = project.tasks.filter((t) => t.status === "completed").length;

  return (
    <article className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <LayersIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <Link href={`/admin/projects/${project.id}`} className="font-heading text-base font-semibold hover:underline">
              {project.name}
            </Link>
            <span className="text-sm text-muted-foreground"> · {project.client?.company_name}</span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="active">{project.service?.title}</Badge>
              <Badge variant={overdue ? "urgent" : "completed"}>{overdue ? "At risk" : "On track"}</Badge>
              <DueDate date={project.due_date} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <div className="w-44">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">Delivery progress</span>
              <span className="font-semibold text-primary">{project.progress_percent}%</span>
            </div>
            <Progress value={project.progress_percent} indicatorClassName={cn(overdue && "bg-rose-500")} />
            <p className="mt-1 text-[11px] text-muted-foreground">{done}/{project.tasks.length} tasks completed</p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-[11px] text-muted-foreground">Assignees</p>
            {project.assignees.length === 0 ? (
              <span className="text-xs italic text-muted-foreground">None</span>
            ) : (
              <AvatarGroup names={project.assignees.map((a) => a.full_name)} max={4} size="md" className="justify-end" />
            )}
          </div>
        </div>
      </div>

      {project.tasks.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Delivery pipeline</p>
          <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {project.tasks.slice(0, 5).map((t) => <PipelineStep key={t.id} task={t} />)}
          </ul>
          {project.tasks.length > 5 && (
            <p className="mt-1 text-[11px] text-muted-foreground">+{project.tasks.length - 5} more tasks</p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span>Lead: {project.lead?.full_name ?? "Unassigned"}</span>
        <div className="ml-auto flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/tasks?project=${project.id}`}>Open board</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/projects/${project.id}`}>Details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
