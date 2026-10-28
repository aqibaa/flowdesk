import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { AlertTriangleIcon, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Due date with overdue / due-soon emphasis. `done` suppresses the warning
 * (completed / cancelled projects and tasks are never "overdue").
 */
export function DueDate({ date, done = false, className }) {
  if (!date) return <span className={cn("text-xs text-muted-foreground", className)}>No due date</span>;

  const d = parseISO(date);
  const days = differenceInCalendarDays(d, new Date());
  const overdue = !done && days < 0;
  const soon = !done && days >= 0 && days <= 3;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        overdue ? "font-semibold text-rose-600 dark:text-rose-400" : soon ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground",
        className
      )}
    >
      {overdue ? <AlertTriangleIcon className="size-3.5" /> : <CalendarIcon className="size-3.5" />}
      {format(d, "d MMM yyyy")}
      {overdue && ` (${Math.abs(days)}d overdue)`}
      {soon && (days === 0 ? " (today)" : ` (${days}d left)`)}
    </span>
  );
}
