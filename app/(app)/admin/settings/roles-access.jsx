"use client";

import { useState, useTransition } from "react";
import { InfoIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { updateUserRole } from "@/lib/actions/team";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function RoleRow({ user, isSelf }) {
  const [role, setRole] = useState(user.role);
  const [pending, start] = useTransition();
  const dirty = role !== user.role;

  const save = () =>
    start(async () => {
      const res = await updateUserRole({ user_id: user.id, role });
      res.ok ? toast.success(res.message) : toast.error(res.message);
      if (!res.ok) setRole(user.role);
    });

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
      <Avatar name={user.full_name ?? user.email} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {user.full_name ?? "—"}
          {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <span className="text-xs text-muted-foreground">
        Current: <Badge variant={user.role === "admin" ? "active" : "secondary"} className="ml-1 capitalize">{user.role}</Badge>
      </span>
      <Select value={role} onValueChange={setRole} disabled={isSelf || pending || !user.is_active}>
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="employee">Employee</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" onClick={save} disabled={!dirty || pending}>
        {pending && <Loader2Icon className="animate-spin" />} Save
      </Button>
    </li>
  );
}

/** Roles & Access tab: one row per user with an Admin/Employee dropdown. */
export function RolesAccess({ users, currentUserId }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-dashed bg-accent/40 p-3 text-xs text-accent-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        <p>
          Only two roles exist: <strong>Admin</strong> (full access) and <strong>Employee</strong> (own tasks only). Clients never log in.
          You cannot change your own role, and inactive accounts must be reactivated on the Team page first.
        </p>
      </div>
      <ul className="space-y-2">
        {users.map((u) => (
          <RoleRow key={u.id} user={u} isSelf={u.id === currentUserId} />
        ))}
      </ul>
    </div>
  );
}
