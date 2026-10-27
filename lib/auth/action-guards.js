import { getCurrentProfile } from "@/lib/auth/get-current-profile";

/**
 * Guards for Server Actions. Unlike the layout guards these THROW, so the
 * calling action can turn the failure into a form error / toast instead of a
 * redirect. Every admin action calls requireAdminAction() first — RLS is
 * still the real wall underneath.
 */

export class AuthError extends Error {
  constructor(message, code = "unauthorized") {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

export async function requireUserAction() {
  const { supabase, profile } = await getCurrentProfile();
  if (!profile) throw new AuthError("You must be signed in.", "unauthenticated");
  if (!profile.is_active) throw new AuthError("Your account is inactive.", "inactive");
  return { supabase, profile };
}

export async function requireAdminAction() {
  const ctx = await requireUserAction();
  if (ctx.profile.role !== "admin") {
    throw new AuthError("Admin access required.", "forbidden");
  }
  return ctx;
}
