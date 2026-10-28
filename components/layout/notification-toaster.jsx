"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { markNotificationRead } from "@/lib/actions/notifications";

/** Same routing as the bell menu. */
function hrefFor(n, role) {
  if (!n.task_id) return role === "admin" ? "/admin" : "/employee";
  return role === "admin" ? `/admin/tasks?task=${n.task_id}` : `/employee/tasks?task=${n.task_id}`;
}

/**
 * Listens on Supabase Realtime for INSERTs into `notifications` for the
 * signed-in user (RLS limits the channel to their own rows) and pops a toast.
 * Push-based: no polling. Renders nothing itself.
 */
export function NotificationToaster({ userId, role }) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        ({ new: n }) => {
          toast(n.title, {
            description: n.body ?? undefined,
            duration: 8000,
            action: {
              label: "Open",
              onClick: async () => {
                await markNotificationRead(n.id);
                router.push(hrefFor(n, role));
              },
            },
          });
          // Refresh server data so the bell badge/list picks up the new row.
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role, router]);

  return null;
}
