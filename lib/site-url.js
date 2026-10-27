import { headers } from "next/headers";

/**
 * Absolute origin of the running app, for links in auth emails.
 * Prefers NEXT_PUBLIC_SITE_URL (set it on Vercel to the production domain);
 * falls back to the incoming request's host so local dev works untouched.
 */
export async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
