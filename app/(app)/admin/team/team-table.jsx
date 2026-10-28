"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { setUserActive, updateUserRole } from "@/lib/actions/team";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import { workloadStatus } from "@/lib/workload";

function RoleSelect({ user, disabled }) {
  const [pending, start] = useTransition();
  return (
    <Select
      value={user.role}
      disabled={disabled || pending}
      onValueChange={(role) =>
        start(async () => {
          const res = await updateUserRole({ user_id: user.id, role });
          res.ok ? toast.success(res.message) : toast.error(res.message);
        })
      }
    >
      <SelectTrigger size="sm" className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="employee">Employee</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}

function WorkloadMeter({ user }) {
  if (user.role !== "employee" || !user.is_active) return <span className="text-xs text-muted-foreground">—</span>;
  const status = workloadStatus(user.workload_percent);
  const bar = user.workload_percent > 100 ? "bg-rose-500" : user.workload_percent >= 85 ? "bg-amber-500" : user.workload_percent >= 50 ? "bg-emerald-500" : "bg-primary";
  return (
    <div className="w-40 space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Capacity</span>
        <span className={cn("font-semibold", user.workload_percent > 100 && "text-rose-600 dark:text-rose-400")}>{user.workload_percent}%</span>
      </div>
      <Progress value={user.workload_percent} className="h-1.5" indicatorClassName={bar} />
      <p className="text-[11px] text-muted-foreground">{user.hours_due_this_week}h due this week · <Badge variant={status.variant} className="px-1.5 py-0 text-[10px]">{status.label}</Badge></p>
    </div>
  );
}

export function TeamTable({ profiles, currentUserId }) {
  const [pending, start] = useTransition();
  const toggleActive = (user) =>
    start(async () => {
      const res = await setUserActive({ user_id: user.id, is_active: !user.is_active });
      res.ok ? toast.success(res.message) : toast.error(res.message);
    });

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Employee</TableHead>
            <TableHead>Role &amp; title</TableHead>
            <TableHead>Active tasks</TableHead>
            <TableHead>Workload meter</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <TableRow key={user.id} className={!user.is_active ? "opacity-60" : undefined}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={user.full_name ?? user.email} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {user.full_name ?? "—"}
                        {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleSelect user={user} disabled={isSelf} />
                  <p className="mt-1 text-xs text-muted-foreground">{user.job_title ?? "No title"}</p>
                </TableCell>
                <TableCell>
                  {user.role === "employee" ? (
                    <div>
                      <Badge variant="secondary">{user.open_task_count} open</Badge>
                      {user.overdue_task_count > 0 && (
                        <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">{user.overdue_task_count} overdue</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell><WorkloadMeter user={user} /></TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "completed" : "cancelled"}>{user.is_active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    {user.role === "employee" && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/tasks?assignee=${user.id}`}>View tasks</Link>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="More" disabled={isSelf || pending}>
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem variant={user.is_active ? "destructive" : "default"} onSelect={() => toggleActive(user)}>
                          {user.is_active ? "Deactivate account" : "Reactivate account"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
