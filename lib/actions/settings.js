"use server";

import { revalidatePath } from "next/cache";
import { requireUserAction } from "@/lib/auth/action-guards";
import { actionError, failure, fieldErrors, success } from "@/lib/action-state";
import { changePasswordSchema, notificationPrefsSchema, profileSchema } from "@/lib/validations/settings";

/** Pages that render the current user's name/title. */
function revalidateSelf() {
  revalidatePath("/admin/settings");
  revalidatePath("/employee/settings");
  revalidatePath("/admin/team");
  revalidatePath("/admin", "layout");
  revalidatePath("/employee", "layout");
}

/** Edit own name / job title (RLS: own row). Role is never touched here. */
export async function updateMyProfile(input) {
  try {
    const { supabase, profile } = await requireUserAction();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return failure("Check the highlighted fields.", fieldErrors(parsed.error));

    const { error } = await supabase.from("profiles").update(parsed.data).eq("id", profile.id);
    if (error) return failure(error.message);

    revalidateSelf();
    return success("Profile saved.");
  } catch (e) {
    return actionError(e);
  }
}

/** Change own password through Supabase Auth. */
export async function changeMyPassword(input) {
  try {
    const { supabase } = await requireUserAction();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return failure("Check the highlighted fields.", fieldErrors(parsed.error));

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return failure(error.message);

    return success("Password updated.");
  } catch (e) {
    return actionError(e);
  }
}

/** Save notification toggles into profiles.notification_prefs (own row). */
export async function updateMyNotificationPrefs(input) {
  try {
    const { supabase, profile } = await requireUserAction();
    const parsed = notificationPrefsSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid preferences.");

    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: parsed.data })
      .eq("id", profile.id);
    if (error) return failure(error.message);

    revalidateSelf();
    return success("Preferences saved.");
  } catch (e) {
    return actionError(e);
  }
}
