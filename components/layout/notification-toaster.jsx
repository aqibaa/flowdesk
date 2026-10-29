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

    // Unique topic per mount: the browser client is a singleton, and React
    // (Strict Mode) mounts twice, so re-using a topic would re-join a channel
    // that is still tearing down.
    const channel = supabase
      .channel(`notifications:${userId}:${Date.now()}`)
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
      .subscribe((status, err) => {
        // Visible in the browser console; SUBSCRIBED = live push is working.
        if (status === "SUBSCRIBED") console.info("[notifications] live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") console.warn("[notifications] realtime", status, err?.message ?? "");
      });

    return () => {
      // Only leave this channel. removeChannel() would also close the shared
      // socket while the next mount is already joining on it.
      channel.unsubscribe();
    };
  }, [userId, role, router]);

  return null;
}
