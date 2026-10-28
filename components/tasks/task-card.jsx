"use client";

import { CalendarIcon, CheckSquareIcon, MessageSquareIcon } from "lucide-react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { TASK_PRIORITY_LABELS } from "@/lib/constants";
import { cn, formatTaskKey } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/**
 * Kanban card. Presentational; the board wraps it with drag handlers.
 * @param {{ task: object, onOpen?: () => void, dragging?: boolean, className?: string }} props
 */
export function TaskCard({ task, onOpen, dragging = false, hideAssignee = false, className, ...rest }) {
  const done = task.status === "completed";
  const days = task.due_date ? differenceInCalendarDays(parseISO(task.due_date), new Date()) : null;
  const overdue = !done && days !== null && days < 0;

  return (
    <article
      onClick={onOpen}
      className={cn(
        "cursor-pointer rounded-xl border bg-card p-3 shadow-xs transition hover:border-primary/40 hover:shadow-soft",
        dragging && "rotate-1 opacity-90 shadow-lg ring-2 ring-primary/40",
        className
      )}
      {...rest}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-muted-foreground">
          {task.project?.client?.company_name ?? task.project?.name}
        </span>
        <Badge variant={task.priority}>{TASK_PRIORITY_LABELS[task.priority]}</Badge>
      </div>

      <p className={cn("mt-1.5 text-sm font-semibold leading-snug", done && "text-muted-foreground line-through")}>
        {task.title}
      </p>
      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{formatTaskKey(task.task_number)}</p>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        {task.due_date && (
          <span className={cn("inline-flex items-center gap-1", overdue && "font-semibold text-rose-600 dark:text-rose-400")}>
            <CalendarIcon className="size-3" /> {format(parseISO(task.due_date), "d MMM")}
          </span>
        )}
        {task.subtask_total > 0 && (
          <span className="inline-flex items-center gap-1">
            <CheckSquareIcon className="size-3" /> {task.subtask_done}/{task.subtask_total}
          </span>
        )}
        {task.comment_count > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquareIcon className="size-3" /> {task.comment_count}
          </span>
        )}
        {!hideAssignee && <span className="ml-auto">
          {task.assignee ? (
            <Avatar name={task.assignee.full_name} size="sm" />
          ) : (
            <span className="rounded-full border border-dashed px-1.5 py-0.5 text-[10px]">Unassigned</span>
          )}
        </span>}
      </div>
    </article>
  );
}
