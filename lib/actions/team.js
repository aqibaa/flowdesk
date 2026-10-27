"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction, AuthError } from "@/lib/auth/action-guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { failure, fieldErrors, formToObject, success } from "@/lib/action-state";
import {
  inviteEmployeeSchema,
  setActiveSchema,
  updateRoleSchema,
} from "@/lib/validations/auth";

/** Normalises thrown guard errors into the action-state shape. */
function handleActionError(error) {
  if (error instanceof AuthError) return failure(error.message);
  console.error(error);
  return failure("Something went wrong. Please try again.");
}

/**
 * Invite an employee by email (Team → Invite Employee).
 * Uses the secret-key client ONLY after the admin check. The auth.users
 * trigger creates the profile; we then set job title / role on it.
 */
export async function inviteEmployee(_prevState, formData) {
  try {
    await requireAdminAction();

    const parsed = inviteEmployeeSchema.safeParse(formToObject(formData));
    if (!parsed.success) {
      return failure("Check the highlighted fields.", fieldErrors(parsed.error));
    }
    const { email, full_name, job_title, role } = parsed.data;

    const admin = createAdminClient();
    const siteUrl = await getSiteUrl();

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name },
      redirectTo: `${siteUrl}/auth/confirm`,
    });

    if (error) {
      const msg = /already/i.test(error.message)
        ? "A user with this email already exists."
        : error.message;
      return failure(msg, { email: msg });
    }

    // Profile exists via trigger; set the fields the admin chose.
    const { error: profileError } = await admin
      .from("profiles")
      .update({ full_name, job_title: job_title || null, role })
      .eq("id", data.user.id);
    if (profileError) return failure(profileError.message);

    revalidatePath("/admin/team");
    return success(`Invitation sent to ${email}.`);
  } catch (error) {
    return handleActionError(error);
  }
}

/** Change a user's role. The DB trigger also forbids changing your own. */
export async function updateUserRole(input) {
  try {
    const { supabase, profile } = await requireAdminAction();
    const parsed = updateRoleSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid request.");
    if (parsed.data.user_id === profile.id) {
      return failure("You cannot change your own role.");
    }

    const { error } = await supabase
      .from("profiles")
      .update({ role: parsed.data.role })
      .eq("id", parsed.data.user_id);
    if (error) return failure(error.message);

    revalidatePath("/admin/team");
    return success("Role updated.");
  } catch (error) {
    return handleActionError(error);
  }
}

/** Deactivate / reactivate a user. Deactivated users cannot sign in. */
export async function setUserActive(input) {
  try {
    const { supabase, profile } = await requireAdminAction();
    const parsed = setActiveSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid request.");
    if (parsed.data.user_id === profile.id) {
      return failure("You cannot deactivate your own account.");
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: parsed.data.is_active })
      .eq("id", parsed.data.user_id);
    if (error) return failure(error.message);

    // Mirror the flag at the Auth level: a banned user cannot sign in or
    // refresh a session. Layouts/actions also check profiles.is_active, so an
    // access token issued before deactivation is rejected on its next request.
    const admin = createAdminClient();
    const { error: banError } = await admin.auth.admin.updateUserById(parsed.data.user_id, {
      ban_duration: parsed.data.is_active ? "none" : "876000h",
    });
    if (banError) return failure(banError.message);

    revalidatePath("/admin/team");
    return success(parsed.data.is_active ? "User reactivated." : "User deactivated.");
  } catch (error) {
    return handleActionError(error);
  }
}
