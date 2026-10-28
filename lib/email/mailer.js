import "server-only";

import nodemailer from "nodemailer";

/**
 * SMTP transport from env. Returns null when SMTP is not configured so the
 * app runs fine without email (in-app notifications still work).
 *
 * Env: SMTP_HOST, SMTP_PORT (587 default), SMTP_USER, SMTP_PASS,
 *      SMTP_FROM ("FlowDesk <no-reply@yourdomain.com>")
 */
let cached = null;

export function getMailer() {
  if (cached !== null) return cached;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_FROM) {
    cached = false;
    return cached;
  }
  const port = Number(SMTP_PORT ?? 587);
  cached = {
    from: SMTP_FROM,
    transport: nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    }),
  };
  return cached;
}

/** Minimal HTML wrapper matching the app's look. */
export function renderEmail({ title, body, ctaLabel, ctaUrl }) {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  return `<!doctype html><html><body style="margin:0;background:#f5f5fb;font-family:Inter,Arial,sans-serif;color:#1f1f2e">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e8e8f0">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6366F1;font-weight:700">FlowDesk</p>
    <h1 style="margin:0 0 12px;font-size:20px">${esc(title)}</h1>
    ${body ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#4b4b63">${esc(body)}</p>` : ""}
    ${ctaUrl ? `<a href="${esc(ctaUrl)}" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;font-size:14px">${esc(ctaLabel ?? "Open in FlowDesk")}</a>` : ""}
    <p style="margin:24px 0 0;font-size:12px;color:#8a8aa3">You receive this because of your notification settings in FlowDesk.</p>
  </div></body></html>`;
}
