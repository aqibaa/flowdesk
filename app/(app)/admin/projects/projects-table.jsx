"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanbanIcon } from "lucide-react";
import { format } from "date-fns";
import { useUrlState } from "@/hooks/use-url-state";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { DueDate } from "@/components/shared/due-date";
import { ProjectFormDialog } from "@/components/forms/project-form-dialog";
import { ActivateButton } from "./activate-button";

export function ProjectsTable({ rows, total, page, options }) {
  const router = useRouter();
  const { params } = useUrlState();
  const filtered = ["q", "status", "service", "client"].some((k) => params.get(k));

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FolderKanbanIcon}
        title={filtered ? "No projects match these filters" : "No projects yet"}
        description={filtered ? "Try clearing a filter." : "Create a project from a client and a service template."}
        action={!filtered && <ProjectFormDialog options={options} />}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Project &amp; client</TableHead>
            <TableHead>Service</TableHead>
            <TableHead className="w-40">Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => {
            const done = p.status === "completed" || p.status === "cancelled";
            return (
              <TableRow
                key={p.id}
                className="cursor-pointer"
                onClick={() => router.push(`/admin/projects/${p.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={p.client?.company_name} size="lg" className="rounded-xl" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.client?.company_name} · created {format(new Date(p.created_at), "d MMM yyyy")}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.service?.title}</TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-primary">{p.progress_percent}%</span>
                    <Progress value={p.progress_percent} indicatorClassName={done && p.status === "completed" ? "bg-emerald-500" : undefined} />
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={p.status}>{PROJECT_STATUS_LABELS[p.status]}</Badge>
                </TableCell>
                <TableCell>
                  {p.lead ? (
                    <span className="inline-flex items-center gap-2 text-sm">
                      <Avatar name={p.lead.full_name} size="sm" /> {p.lead.full_name}
                    </span>
                  ) : (
                    <span className="text-xs italic text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <DueDate date={p.due_date} done={done} />
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  {p.status === "pending" ? (
                    <ActivateButton projectId={p.id} />
                  ) : (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/projects/${p.id}`}>View</Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Pagination page={page} total={total} noun="projects" />
    </div>
  );
}
