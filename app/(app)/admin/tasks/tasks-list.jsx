"use client";

import { ListChecksIcon } from "lucide-react";
import { useUrlState } from "@/hooks/use-url-state";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";
import { formatTaskKey } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { DueDate } from "@/components/shared/due-date";

/** Paginated table view of tasks; row click opens the drawer. */
export function TasksList({ rows, total, page }) {
  const { set } = useUrlState();

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ListChecksIcon}
        title="No tasks match"
        description="Try clearing a filter, or create a task."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-24">Key</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="text-right">Est.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((t) => (
            <TableRow key={t.id} className="cursor-pointer" onClick={() => set({ task: t.id, page })}>
              <TableCell className="font-mono text-xs text-muted-foreground">{formatTaskKey(t.task_number)}</TableCell>
              <TableCell className="max-w-xs whitespace-normal font-medium">{t.title}</TableCell>
              <TableCell>
                <p className="text-sm">{t.project?.name}</p>
                <p className="text-xs text-muted-foreground">{t.project?.client?.company_name}</p>
              </TableCell>
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
      <Pagination page={page} total={total} noun="tasks" />
    </div>
  );
}
