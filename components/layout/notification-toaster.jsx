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
 * Make sure the realtime socket carries a token that is still valid.
 * The server refreshes the session cookie on page requests, but a tab that
 * sits open for an hour never re-sends that token to Realtime, which then
 * closes the socket ("Token has expired"). Refresh when within 60s of expiry.
 */
async function freshAccessToken(supabase) {
  const { data } = await supabase.auth.getSession();
  let session = data?.session;
  const expiresIn = session ? session.expires_at * 1000 - Date.now() : 0;
  if (!session || expiresIn < 60_000) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed?.session ?? session;
  }
  if (session?.access_token) await supabase.realtime.setAuth(session.access_token);
  return Boolean(session?.access_token);
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
    let channel = null;
    let stopped = false;
    let retryTimer = null;

    const subscribe = async (attempt = 0) => {
      if (stopped) return;
      const ok = await freshAccessToken(supabase);
      // The effect may have been cleaned up while we awaited (Strict Mode
      // double-mount); joining now would leave an orphan subscription.
      if (!ok || stopped) return;

      // Unique topic per attempt: the browser client is a singleton and React
      // (Strict Mode) mounts twice, so a re-used topic would re-join a channel
      // that is still tearing down.
      channel = supabase
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
          if (status === "SUBSCRIBED") {
            console.info("[notifications] live");
            return;
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[notifications] realtime", status, err?.message ?? "");
            // Expired token or dropped socket: get a fresh token and re-join
            // with a capped backoff (2s, 4s, 8s, … max 60s).
            if (stopped || retryTimer) return;
            channel?.unsubscribe();
            const delay = Math.min(60_000, 2_000 * 2 ** attempt);
            retryTimer = setTimeout(() => {
              retryTimer = null;
              subscribe(attempt + 1);
            }, delay);
          }
        });
    };

    subscribe();

    // Whenever the auth token rotates (tab focus, auto-refresh), hand the new
    // one to Realtime so long-lived sockets never go stale.
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
    });

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      authSub?.subscription?.unsubscribe();
      // Only leave this channel. removeChannel() would also close the shared
      // socket while the next mount is already joining on it.
      channel?.unsubscribe();
    };
  }, [userId, role, router]);

  return null;
}
