"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeftIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteProject, setProjectStatus } from "@/lib/actions/projects";
import { STATUS_TRANSITIONS } from "@/lib/validations/projects";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DueDate } from "@/components/shared/due-date";
import { ProjectFormDialog } from "@/components/forms/project-form-dialog";
import { ActivateButton } from "../activate-button";

const TRANSITION_LABELS = {
  active: "Resume (set active)",
  on_hold: "Put on hold",
  cancelled: "Cancel project",
  pending: "Reopen as pending",
};

export function ProjectHeader({ project, options }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const done = project.status === "completed" || project.status === "cancelled";
  const transitions = STATUS_TRANSITIONS[project.status] ?? [];

  const changeStatus = (status) =>
    start(async () => {
      const res = await setProjectStatus({ id: project.id, status });
      res.ok ? toast.success(res.message) : toast.error(res.message);
    });

  return (
    <header className="rounded-2xl border bg-card p-6 shadow-soft">
      <Link href="/admin/projects" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-3.5" /> All projects
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={project.status}>{PROJECT_STATUS_LABELS[project.status]}</Badge>
            <span className="text-xs text-muted-foreground">{project.service.title}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{project.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/admin/clients?client=${project.client.id}`} className="font-medium text-foreground hover:underline">
              {project.client.company_name}
            </Link>
            {" · "}Lead: {project.lead?.full_name ?? <span className="italic">unassigned</span>}
            {" · "}<DueDate date={project.due_date} done={done} className="align-middle" />
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {project.status === "pending" && <ActivateButton projectId={project.id} size="default" />}
          <ProjectFormDialog
            project={project}
            options={options}
            trigger={
              <Button variant="outline">
                <PencilIcon /> Edit
              </Button>
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions" disabled={pending}>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Change status</DropdownMenuLabel>
              {transitions.length === 0 && (
                <p className="px-2 pb-1 text-xs text-muted-foreground">No manual changes available.</p>
              )}
              {transitions.map((s) => (
                <DropdownMenuItem key={s} onSelect={() => changeStatus(s)}>
                  {TRANSITION_LABELS[s]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2Icon /> Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={`Delete “${project.name}”?`}
            description="All of its tasks, subtasks, comments and activity are deleted too. This cannot be undone."
            confirmLabel="Delete project"
            destructive
            onConfirm={async () => {
              const res = await deleteProject(project.id);
              if (res.ok) router.push("/admin/projects");
              return res;
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Progress value={project.progress_percent} className="h-2.5" indicatorClassName={project.status === "completed" ? "bg-emerald-500" : undefined} />
        <span className="w-12 text-right font-heading text-lg font-bold text-primary">{project.progress_percent}%</span>
      </div>
      {project.status === "pending" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Activating copies {project.template_task_count} template task{project.template_task_count === 1 ? "" : "s"} from “{project.service.title}”.
        </p>
      )}
    </header>
  );
}
