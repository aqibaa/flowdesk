import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Routes reachable without a session. Everything else requires login. */
// /api/cron is guarded by CRON_SECRET inside the route, not by a session.
const PUBLIC_PATHS = ["/login", "/auth", "/api/cron"];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * Refreshes the Supabase session cookie on every request and redirects
 * unauthenticated users to /login. Called from proxy.js.
 *
 * Note: this only checks *whether* a user is logged in. Role checks (admin vs
 * employee) are done in the route-group layouts and in every Server Action,
 * and RLS is the real wall underneath both.
 */
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not add logic between createServerClient and getClaims().
  // getClaims() verifies the JWT and refreshes the session cookie when needed.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Return the response that carries any refreshed cookies, unmodified.
  return supabaseResponse;
}
