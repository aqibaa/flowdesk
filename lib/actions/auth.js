"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, setPasswordSchema } from "@/lib/validations/auth";
import { failure, fieldErrors, formToObject } from "@/lib/action-state";
import { homePathForRole } from "@/lib/auth/guards";

/** Only allow same-site relative paths for post-login redirects. */
function safeNextPath(next) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : null;
}

/**
 * Email + password sign-in. Used with useActionState on /login.
 * After sign-in, profiles.role decides where the user lands.
 */
export async function signIn(_prevState, formData) {
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return failure("Check the highlighted fields.", fieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return failure("Invalid email or password.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .single();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return failure("Your account has been deactivated. Contact your admin.");
  }

  const next = safeNextPath(formData.get("next"));
  redirect(next ?? homePathForRole(profile.role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Sets the password for a freshly-invited user (they arrive with a session
 * created by /auth/confirm). Also used for ordinary password changes.
 */
export async function setPassword(_prevState, formData) {
  const parsed = setPasswordSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return failure("Check the highlighted fields.", fieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login?error=expired");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return failure(error.message);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.claims.sub)
    .single();

  redirect(homePathForRole(profile?.role));
}
