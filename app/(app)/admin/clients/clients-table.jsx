"use client";

import { BuildingIcon } from "lucide-react";
import { format } from "date-fns";
import { useUrlState } from "@/hooks/use-url-state";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ClientFormDialog } from "@/components/forms/client-form-dialog";

export function ClientsTable({ rows, total, page, selectedId }) {
  const { set, params } = useUrlState();

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={BuildingIcon}
        title={params.get("q") ? "No clients match your search" : "No clients yet"}
        description={params.get("q") ? "Try a different company, contact or email." : "Add your first client to start creating projects."}
        action={!params.get("q") && <ClientFormDialog />}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h2 className="font-heading font-semibold">Client Directory</h2>
        <Badge variant="secondary">{total} clients</Badge>
        <span className="ml-auto text-xs text-muted-foreground">Sorted by name (A–Z)</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Client</TableHead>
            <TableHead>Primary contact</TableHead>
            <TableHead>Services purchased</TableHead>
            <TableHead className="w-44">Overall progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow
              key={c.id}
              onClick={() => set({ client: c.id, page: params.get("page") })}
              className={cn("cursor-pointer", selectedId === c.id && "bg-accent/60 hover:bg-accent/60")}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={c.company_name} size="lg" className="rounded-xl" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Client since {format(new Date(c.created_at), "MMM yyyy")}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{c.contact_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{c.email ?? c.phone ?? ""}</p>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {c.services.length === 0 && <span className="text-xs text-muted-foreground">No projects</span>}
                  {c.services.slice(0, 2).map((s) => (
                    <Badge key={s} variant="active">{s}</Badge>
                  ))}
                  {c.services.length > 2 && <Badge variant="secondary">+{c.services.length - 2}</Badge>}
                </div>
              </TableCell>
              <TableCell>
                {c.avg_progress === null ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">{c.avg_progress}%</span>
                      <span className="text-muted-foreground">
                        {c.active_project_count} active / {c.project_count}
                      </span>
                    </div>
                    <Progress value={c.avg_progress} />
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={page} total={total} noun="clients" />
    </div>
  );
}
