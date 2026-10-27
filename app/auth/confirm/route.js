import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing route for Supabase email links (invite / recovery).
 * Supabase sends the user here with ?token_hash=...&type=invite — set
 * Authentication → URL Configuration → Redirect URLs to include
 * <site>/auth/confirm. Verifying the token creates a session cookie, after
 * which the user is asked to choose a password.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const redirectTo = (path) => NextResponse.redirect(new URL(path, url.origin));

  if (!tokenHash || !type) return redirectTo("/login?error=invalid");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) return redirectTo("/login?error=expired");

  // Invited and password-reset users both need to set a password next.
  if (type === "invite" || type === "recovery") {
    return redirectTo("/auth/set-password");
  }
  return redirectTo("/dashboard");
}
