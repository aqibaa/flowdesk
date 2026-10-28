"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronRightIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useUrlState } from "@/hooks/use-url-state";
import { deleteTask } from "@/lib/actions/tasks";
import { formatTaskKey } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TaskDrawerFields } from "./task-drawer-fields";
import { SubtasksList } from "./subtasks-list";
import { CommentsSection } from "./comments-section";
import { TaskActivity } from "./task-activity";

/**
 * Right-side task drawer (admin). Open state = `?task=<id>` in the URL, so
 * links from other pages open it directly and refresh keeps it open.
 */
export function TaskDrawer({ task, options }) {
  const { set, params } = useUrlState();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [, start] = useTransition();
  const close = () => set({ task: null, page: params.get("page") });

  return (
    <Sheet open={Boolean(task)} onOpenChange={(o) => !o && close()}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        {task && (
          <>
            <SheetTitle className="sr-only">{task.title}</SheetTitle>
            <SheetDescription className="sr-only">Task details</SheetDescription>

            <div className="flex items-center gap-1.5 border-b px-4 py-2.5 text-xs text-muted-foreground">
              <Link href={`/admin/clients?client=${task.project.client.id}`} className="hover:text-foreground">
                {task.project.client.company_name}
              </Link>
              <ChevronRightIcon className="size-3" />
              <Link href={`/admin/projects/${task.project.id}`} className="hover:text-foreground">
                {task.project.name}
              </Link>
              <ChevronRightIcon className="size-3" />
              <span className="font-mono font-medium text-primary">{formatTaskKey(task.task_number)}</span>
            </div>

            <ScrollArea className="h-[calc(100vh-7rem)]">
              <div className="space-y-6 px-4 py-4">
                <TaskDrawerFields key={task.id + task.updated_at} task={task} options={options} />
                <SubtasksList taskId={task.id} subtasks={task.subtasks} />
                <CommentsSection taskId={task.id} comments={task.comments} />
                <TaskActivity activity={task.activity} />
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between border-t px-4 py-2.5">
              <span className="text-xs text-muted-foreground">
                Reported by {task.reporter?.full_name ?? "—"}
              </span>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2Icon /> Delete task
              </Button>
            </div>

            <ConfirmDialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              title={`Delete ${formatTaskKey(task.task_number)}?`}
              description="Subtasks and comments are deleted too. Project progress is recalculated."
              confirmLabel="Delete task"
              destructive
              onConfirm={async () => {
                const res = await deleteTask(task.id);
                if (res.ok) start(() => close());
                else toast.error(res.message);
                return res;
              }}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
