"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CheckCheckIcon, MessageSquareIcon, RefreshCwIcon, UserPlusIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ICONS = {
  task_assigned: UserPlusIcon,
  task_status_changed: RefreshCwIcon,
  task_commented: MessageSquareIcon,
};

/** Where a notification leads, per role. */
function hrefFor(n, role) {
  if (!n.task_id) return role === "admin" ? "/admin" : "/employee";
  return role === "admin" ? `/admin/tasks?task=${n.task_id}` : `/employee/tasks?task=${n.task_id}`;
}

/** Bell with unread badge; dropdown lists the latest 10. */
export function NotificationsMenu({ items, unread, role }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const open = (n) =>
    start(async () => {
      if (!n.is_read) await markNotificationRead(n.id);
      router.push(hrefFor(n, role));
    });

  const readAll = () =>
    start(async () => {
      const res = await markAllNotificationsRead();
      res.ok ? toast.success(res.message) : toast.error(res.message);
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`} className="relative">
          <BellIcon />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={readAll} disabled={pending}>
              <CheckCheckIcon /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto py-1">
            {items.map((n) => {
              const Icon = ICONS[n.type] ?? BellIcon;
              return (
                <DropdownMenuItem
                  key={n.id}
                  onSelect={() => open(n)}
                  className={cn("items-start gap-3 rounded-none px-3 py-2.5", !n.is_read && "bg-accent/40")}
                >
                  <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", n.is_read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm", !n.is_read && "font-semibold")}>{n.title}</span>
                    {n.body && <span className="block truncate text-xs text-muted-foreground">{n.body}</span>}
                    <span className="block text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </span>
                  {!n.is_read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
                </DropdownMenuItem>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
