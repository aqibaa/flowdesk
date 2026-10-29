import "server-only";

import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { getMailer, renderEmail } from "@/lib/email/mailer";

/**
 * Schedule email delivery for every not-yet-emailed notification of a task
 * or a whole project. Call it from a Server Action AFTER the guarded
 * mutation succeeded. The action returns immediately; the sending happens
 * in `after()` once the response has been flushed, so the UI never waits
 * on SMTP and a mail outage cannot fail a task update.
 *
 * `{ projectId }` covers activation (N tasks → one query, one SMTP session).
 */
export function queueNotificationEmails({ taskId, projectId }) {
  if (!taskId && !projectId) return;
  after(() => dispatchPendingEmails({ taskId, projectId }));
}

/**
 * Send pending emails right now. Runs with the secret-key client because
 * recipients' addresses are not readable by an employee's own session (RLS);
 * it only reads/updates `notifications` + `profiles.email/prefs`.
 *
 * Outcome per row:
 * - sent, or recipient has email off / SMTP unset → `emailed_at` stamped
 *   (so enabling SMTP later never floods users with old events);
 * - send failed → `emailed_at` stays NULL, `email_error` holds the reason,
 *   and the row is retried on the next dispatch for that project.
 */
export async function dispatchPendingEmails({ taskId, projectId } = {}) {
  let processed = 0;
  try {
    const admin = createAdminClient();
    let query = admin
      .from("notifications")
      .select("id, user_id, type, title, body, task_id, recipient:profiles!notifications_user_id_fkey(email, full_name, role, is_active, notification_prefs)")
      .is("emailed_at", null)
      .order("created_at")
      .limit(200);
    // No filter = every pending row (cron route: reminders + retries).
    if (taskId) query = query.eq("task_id", taskId);
    else if (projectId) query = query.eq("project_id", projectId);

    const { data: rows, error } = await query;
    if (error || !rows?.length) return processed;

    const mailer = getMailer();
    const siteUrl = await getSiteUrl();
    const sent = [];
    const failed = [];

    for (const n of rows) {
      const r = n.recipient;
      const wantsEmail = r?.notification_prefs?.[n.type]?.email ?? true;
      if (mailer && r?.email && r.is_active && wantsEmail) {
        const home = r.role === "admin" ? "/admin" : "/employee";
        const path = n.task_id ? `${home}/tasks?task=${n.task_id}` : home;
        try {
          await mailer.transport.sendMail({
            from: mailer.from,
            to: r.email,
            subject: `[FlowDesk] ${n.title}`,
            text: `${n.title}\n\n${n.body ?? ""}\n\nOpen: ${siteUrl}${path}`,
            html: renderEmail({ title: n.title, body: n.body, ctaLabel: n.task_id ? "Open task" : "Open FlowDesk", ctaUrl: `${siteUrl}${path}` }),
          });
        } catch (e) {
          console.error("[email] send failed", n.id, e?.message);
          failed.push({ id: n.id, message: String(e?.message ?? e).slice(0, 500) });
          continue;
        }
      }
      sent.push(n.id);
      processed += 1;
    }

    const now = new Date().toISOString();
    if (sent.length) {
      await admin.from("notifications").update({ emailed_at: now, email_error: null }).in("id", sent);
    }
    for (const f of failed) {
      await admin.from("notifications").update({ email_error: f.message }).eq("id", f.id);
    }
  } catch (e) {
    console.error("[email] dispatch failed", e?.message);
  }
  return processed;
}
