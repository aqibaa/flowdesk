import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { getMailer, renderEmail } from "@/lib/email/mailer";

/**
 * Email every notification for `taskId` that has not been emailed yet and
 * whose recipient has the `email` toggle on for that type.
 *
 * Runs with the secret-key client because recipients' addresses are not
 * readable by an employee's own session (RLS). It is called from Server
 * Actions AFTER the guarded mutation succeeded, never from client code,
 * and only reads/updates `notifications` + `profiles.email/prefs`.
 *
 * Best-effort: errors are logged and swallowed so the UI never fails on
 * mail problems. Rows are stamped `emailed_at` even when SMTP is off, so
 * enabling SMTP later does not flood users with old events.
 */
export async function dispatchPendingEmails(taskId) {
  if (!taskId) return;
  try {
    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from("notifications")
      .select("id, user_id, type, title, body, task_id, recipient:profiles!notifications_user_id_fkey(email, full_name, role, is_active, notification_prefs)")
      .eq("task_id", taskId)
      .is("emailed_at", null);
    if (error || !rows?.length) return;

    const mailer = getMailer();
    const siteUrl = await getSiteUrl();
    const sent = [];

    for (const n of rows) {
      const r = n.recipient;
      const wantsEmail = r?.notification_prefs?.[n.type]?.email ?? true;
      if (mailer && r?.email && r.is_active && wantsEmail) {
        const path = r.role === "admin" ? `/admin/tasks?task=${n.task_id}` : `/employee/tasks?task=${n.task_id}`;
        try {
          await mailer.transport.sendMail({
            from: mailer.from,
            to: r.email,
            subject: `[FlowDesk] ${n.title}`,
            text: `${n.title}\n\n${n.body ?? ""}\n\nOpen: ${siteUrl}${path}`,
            html: renderEmail({ title: n.title, body: n.body, ctaLabel: "Open task", ctaUrl: `${siteUrl}${path}` }),
          });
        } catch (e) {
          console.error("[email] send failed", n.id, e?.message);
          continue; // leave emailed_at null so it can be retried next time
        }
      }
      sent.push(n.id);
    }

    if (sent.length) {
      await admin.from("notifications").update({ emailed_at: new Date().toISOString() }).in("id", sent);
    }
  } catch (e) {
    console.error("[email] dispatch failed", e?.message);
  }
}
