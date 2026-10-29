"use client";

import { useTransition } from "react";
import { ChevronRightIcon, XIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUrlState } from "@/hooks/use-url-state";
import { addMyComment, updateMyTaskStatus } from "@/lib/actions/employee";
import { TASK_PRIORITY_LABELS } from "@/lib/constants";
import { formatTaskKey } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DueDate } from "@/components/shared/due-date";
import { StatusPillSelect } from "./status-pill-select";
import { SubtasksList } from "./subtasks-list";
import { CommentsSection } from "./comments-section";

function Fact({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{children}</div>
    </div>
  );
}

/**
 * Employee task drawer (?task=<id>): read-only details, status change via
 * the RPC, read-only subtasks, and comments through the employee action.
 * No activity log (employees have no access to activity_log).
 */
export function EmployeeTaskDrawer({ task }) {
  const { set, params } = useUrlState();
  const [pending, start] = useTransition();
  const close = () => set({ task: null, done: params.get("done") });

  const changeStatus = (status) =>
    start(async () => {
      const res = await updateMyTaskStatus({ task_id: task.id, status });
      res.ok ? toast.success(res.message) : toast.error(res.message);
    });

  return (
    <Sheet open={Boolean(task)} onOpenChange={(o) => !o && close()}>
      <SheetContent hideClose className="w-full gap-0 p-0 sm:max-w-md">
        {task && (
          <>
            <SheetTitle className="sr-only">{task.title}</SheetTitle>
            <SheetDescription className="sr-only">Task details</SheetDescription>

            <div className="flex items-center gap-1.5 border-b px-4 py-2.5 text-xs text-muted-foreground">
              <span>{task.client_company_name}</span>
              <ChevronRightIcon className="size-3" />
              <span className="truncate">{task.project_name}</span>
              <ChevronRightIcon className="size-3" />
              <span className="font-mono font-medium text-primary">{formatTaskKey(task.task_number)}</span>
            </div>

            <ScrollArea className="h-[calc(100vh-3.5rem)]">
              <div className="space-y-6 px-4 py-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <StatusPillSelect value={task.status} onChange={changeStatus} disabled={pending} />
                    <Badge variant={task.priority}>{TASK_PRIORITY_LABELS[task.priority]}</Badge>
                    {/* Close sits on the status row, clear of the breadcrumb. */}
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="ml-auto size-8 text-muted-foreground" aria-label="Close">
                        <XIcon />
                      </Button>
                    </SheetClose>
                  </div>
                  <h2 className="font-heading text-xl font-bold leading-tight">{task.title}</h2>
                  {task.description ? (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{task.description}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">No description.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
                  <Fact label="Due date"><DueDate date={task.due_date} done={task.status === "completed"} className="text-sm" /></Fact>
                  <Fact label="Estimate">{task.estimated_hours ? `${Number(task.estimated_hours)}h` : "—"}</Fact>
                  <Fact label="Service">{task.service_title}</Fact>
                  <Fact label="Completed">{task.completed_at ? format(new Date(task.completed_at), "d MMM yyyy") : "—"}</Fact>
                </div>

                <SubtasksList taskId={task.id} subtasks={task.subtasks} readOnly />
                <CommentsSection taskId={task.id} comments={task.comments} submitAction={addMyComment} />
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
