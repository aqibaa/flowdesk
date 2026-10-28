"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserAction } from "@/lib/auth/action-guards";
import { dispatchPendingEmails } from "@/lib/email/dispatch";
import { actionError, failure, fieldErrors, success } from "@/lib/action-state";
import { commentCreateSchema } from "@/lib/validations/tasks";
import { TASK_STATUSES } from "@/lib/constants";

const statusSchema = z.object({ task_id: z.uuid(), status: z.enum(TASK_STATUSES) });

function revalidateMine() {
  revalidatePath("/employee");
  revalidatePath("/employee/tasks");
  revalidatePath("/employee/board");
  // Admin views show the same tasks / progress.
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  revalidatePath("/admin/monitor");
}

/**
 * The ONLY way an employee changes a task: update_my_task_status RPC
 * (security definer; checks assignee_id = auth.uid() and updates status only).
 * Progress, completed_at and activity follow via DB triggers.
 */
export async function updateMyTaskStatus(input) {
  try {
    const { supabase } = await requireUserAction();
    const parsed = statusSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid request.");

    const { error } = await supabase.rpc("update_my_task_status", {
      p_task_id: parsed.data.task_id,
      p_new_status: parsed.data.status,
    });
    if (error) return failure(error.message);

    revalidateMine();
    await dispatchPendingEmails(parsed.data.task_id);
    return success(parsed.data.status === "completed" ? "Task completed 🎉" : "Status updated.");
  } catch (e) {
    return actionError(e);
  }
}

/** Comment on one of my tasks. RLS allows the insert only when assigned to me. */
export async function addMyComment(input) {
  try {
    const { supabase, profile } = await requireUserAction();
    const parsed = commentCreateSchema.safeParse(input);
    if (!parsed.success) return failure("Write a comment first.", fieldErrors(parsed.error));

    const { error } = await supabase
      .from("task_comments")
      .insert({ ...parsed.data, author_id: profile.id });
    if (error) {
      return failure(error.code === "42501" ? "You can only comment on tasks assigned to you." : error.message);
    }

    revalidateMine();
    await dispatchPendingEmails(parsed.data.task_id);
    return success("Comment posted.");
  } catch (e) {
    return actionError(e);
  }
}
