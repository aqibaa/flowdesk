"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/action-guards";
import { actionError, failure, fieldErrors, success } from "@/lib/action-state";
import {
  commentCreateSchema,
  subtaskCreateSchema,
  subtaskIdSchema,
  subtaskToggleSchema,
  taskCreateSchema,
  taskIdSchema,
  taskMoveSchema,
  taskUpdateSchema,
} from "@/lib/validations/tasks";

/** Tasks show up on several pages; refresh all of them. */
function revalidateTasks(projectId) {
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/projects");
  if (projectId) revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/monitor");
  revalidatePath("/employee");
  revalidatePath("/employee/tasks");
}

async function projectIdOf(supabase, taskId) {
  const { data } = await supabase.from("tasks").select("project_id").eq("id", taskId).single();
  return data?.project_id ?? null;
}

export async function createTask(input) {
  try {
    const { supabase, profile } = await requireAdminAction();
    const parsed = taskCreateSchema.safeParse(input);
    if (!parsed.success) return failure("Check the highlighted fields.", fieldErrors(parsed.error));

    // New cards go to the bottom of their column.
    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", parsed.data.project_id)
      .eq("status", parsed.data.status);

    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...parsed.data, reporter_id: profile.id, position: count ?? 0 })
      .select("id")
      .single();
    if (error) return failure(error.message);

    revalidateTasks(parsed.data.project_id);
    return success("Task created.", { id: data.id });
  } catch (e) {
    return actionError(e);
  }
}

/** Partial update from the drawer (one field or several). */
export async function updateTask(id, input) {
  try {
    const { supabase } = await requireAdminAction();
    if (!taskIdSchema.safeParse({ id }).success) return failure("Invalid task.");
    const parsed = taskUpdateSchema.safeParse(input);
    if (!parsed.success) return failure("Check the highlighted fields.", fieldErrors(parsed.error));
    if (Object.keys(parsed.data).length === 0) return success("Nothing to update.");

    const { data, error } = await supabase
      .from("tasks")
      .update(parsed.data)
      .eq("id", id)
      .select("project_id")
      .single();
    if (error) return failure(error.message);

    revalidateTasks(data.project_id);
    return success("Task updated.");
  } catch (e) {
    return actionError(e);
  }
}

/** Kanban drop → move_task RPC (atomic status + reorder). */
export async function moveTask(input) {
  try {
    const { supabase } = await requireAdminAction();
    const parsed = taskMoveSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid move.");

    const { error } = await supabase.rpc("move_task", {
      p_task_id: parsed.data.task_id,
      p_new_status: parsed.data.status,
      p_ordered_ids: parsed.data.ordered_ids,
    });
    if (error) return failure(error.message);

    revalidateTasks(await projectIdOf(supabase, parsed.data.task_id));
    return success("Task moved.");
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteTask(id) {
  try {
    const { supabase } = await requireAdminAction();
    if (!taskIdSchema.safeParse({ id }).success) return failure("Invalid task.");

    const projectId = await projectIdOf(supabase, id);
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return failure(error.message);

    revalidateTasks(projectId);
    return success("Task deleted.");
  } catch (e) {
    return actionError(e);
  }
}

// ---------------------------------------------------------------------------
// Subtasks
// ---------------------------------------------------------------------------

export async function addSubtask(input) {
  try {
    const { supabase } = await requireAdminAction();
    const parsed = subtaskCreateSchema.safeParse(input);
    if (!parsed.success) return failure("Check the subtask.", fieldErrors(parsed.error));

    const { count } = await supabase
      .from("task_subtasks")
      .select("id", { count: "exact", head: true })
      .eq("task_id", parsed.data.task_id);

    const { error } = await supabase
      .from("task_subtasks")
      .insert({ ...parsed.data, position: count ?? 0 });
    if (error) return failure(error.message);

    revalidateTasks(await projectIdOf(supabase, parsed.data.task_id));
    return success("Subtask added.");
  } catch (e) {
    return actionError(e);
  }
}

export async function toggleSubtask(input) {
  try {
    const { supabase } = await requireAdminAction();
    const parsed = subtaskToggleSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid subtask.");

    const { data, error } = await supabase
      .from("task_subtasks")
      .update({ is_done: parsed.data.is_done })
      .eq("id", parsed.data.id)
      .select("task_id")
      .single();
    if (error) return failure(error.message);

    revalidateTasks(await projectIdOf(supabase, data.task_id));
    return success(parsed.data.is_done ? "Subtask done." : "Subtask reopened.");
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteSubtask(id) {
  try {
    const { supabase } = await requireAdminAction();
    if (!subtaskIdSchema.safeParse({ id }).success) return failure("Invalid subtask.");

    const { data, error } = await supabase
      .from("task_subtasks")
      .delete()
      .eq("id", id)
      .select("task_id")
      .single();
    if (error) return failure(error.message);

    revalidateTasks(await projectIdOf(supabase, data.task_id));
    return success("Subtask removed.");
  } catch (e) {
    return actionError(e);
  }
}

// ---------------------------------------------------------------------------
// Comments (admin version; employees get their own action in Phase 6)
// ---------------------------------------------------------------------------

export async function addComment(input) {
  try {
    const { supabase, profile } = await requireAdminAction();
    const parsed = commentCreateSchema.safeParse(input);
    if (!parsed.success) return failure("Write a comment first.", fieldErrors(parsed.error));

    const { error } = await supabase
      .from("task_comments")
      .insert({ ...parsed.data, author_id: profile.id });
    if (error) return failure(error.message);

    revalidateTasks(await projectIdOf(supabase, parsed.data.task_id));
    return success("Comment posted.");
  } catch (e) {
    return actionError(e);
  }
}
