import Link from "next/link";
import { ListChecksIcon } from "lucide-react";
import { TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/constants";
import { formatTaskKey } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { DueDate } from "@/components/shared/due-date";

/**
 * Read-only task list for the project detail page. Editing (drawer, DnD,
 * create) lives on /admin/tasks, which this links to with the project
 * preselected.
 */
export function ProjectTasks({ project }) {
  const boardHref = `/admin/tasks?project=${project.id}`;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
        <h2 className="font-heading font-semibold">Tasks</h2>
        <div className="flex flex-wrap gap-1.5">
          {TASK_STATUSES.map((s) => (
            <Badge key={s} variant={s}>
              {TASK_STATUS_LABELS[s]} {project.task_counts[s]}
            </Badge>
          ))}
        </div>
        <Button asChild size="sm" variant="outline" className="ml-auto">
          <Link href={boardHref}>Open board</Link>
        </Button>
      </div>

      {project.tasks.length === 0 ? (
        <EmptyState
          icon={ListChecksIcon}
          title={project.status === "pending" ? "No tasks until activation" : "No tasks yet"}
          description={
            project.status === "pending"
              ? "Activate the project to copy the service's template tasks, or add tasks on the board."
              : "Add tasks from the board."
          }
          className="m-5"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-24">Key</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Est.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.tasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  <Link href={`${boardHref}&task=${t.id}`} className="hover:text-primary hover:underline">
                    {formatTaskKey(t.task_number)}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-normal font-medium">{t.title}</TableCell>
                <TableCell><Badge variant={t.status}>{TASK_STATUS_LABELS[t.status]}</Badge></TableCell>
                <TableCell><Badge variant={t.priority}>{TASK_PRIORITY_LABELS[t.priority]}</Badge></TableCell>
                <TableCell>
                  {t.assignee ? (
                    <span className="inline-flex items-center gap-2 text-sm">
                      <Avatar name={t.assignee.full_name} size="sm" /> {t.assignee.full_name}
                    </span>
                  ) : (
                    <span className="text-xs italic text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell><DueDate date={t.due_date} done={t.status === "completed"} /></TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {t.estimated_hours ? `${Number(t.estimated_hours)}h` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
