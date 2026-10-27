"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { setUserActive, updateUserRole } from "@/lib/actions/team";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      <SelectTrigger size="sm" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="employee">Employee</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ActiveToggle({ user, disabled }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          const res = await setUserActive({ user_id: user.id, is_active: !user.is_active });
          res.ok ? toast.success(res.message) : toast.error(res.message);
        })
      }
    >
      {user.is_active ? "Deactivate" : "Reactivate"}
    </Button>
  );
}

export function TeamTable({ profiles, currentUserId }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Member</TableHead>
            <TableHead>Job title</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
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
                    <Avatar name={user.full_name ?? user.email} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {user.full_name ?? "—"}
                        {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.job_title ?? "—"}</TableCell>
                <TableCell>
                  <RoleSelect user={user} disabled={isSelf} />
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "completed" : "cancelled"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(user.created_at), "d MMM yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <ActiveToggle user={user} disabled={isSelf} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
