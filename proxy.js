import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 proxy (formerly middleware). Refreshes the Supabase session on
 * every app request and bounces anonymous users to /login.
 */
export async function proxy(request) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets, images and favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
