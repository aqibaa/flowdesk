import { NextResponse } from "next/server";
import { dispatchPendingEmails } from "@/lib/email/dispatch";

/**
 * Daily email sweep (vercel.json cron, 03:10 UTC — right after the DB
 * reminder job). Sends every notification still waiting for an email:
 * cron-generated reminders (no Server Action ran for them) and earlier
 * failed sends. Vercel calls it with `Authorization: Bearer $CRON_SECRET`.
 */
export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const processed = await dispatchPendingEmails();
  return NextResponse.json({ ok: true, processed });
}
