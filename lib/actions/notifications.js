"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserAction } from "@/lib/auth/action-guards";
import { actionError, failure, success } from "@/lib/action-state";

function revalidateShell() {
  revalidatePath("/admin", "layout");
  revalidatePath("/employee", "layout");
}

/** Mark one of my notifications read (RLS: own rows only). */
export async function markNotificationRead(id) {
  try {
    const { supabase } = await requireUserAction();
    if (!z.uuid().safeParse(id).success) return failure("Invalid notification.");
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) return failure(error.message);
    revalidateShell();
    return success("Marked read.");
  } catch (e) {
    return actionError(e);
  }
}

export async function markAllNotificationsRead() {
  try {
    const { supabase, profile } = await requireUserAction();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
    if (error) return failure(error.message);
    revalidateShell();
    return success("All caught up.");
  } catch (e) {
    return actionError(e);
  }
}
