"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/action-guards";
import { dispatchPendingEmails } from "@/lib/email/dispatch";
import { actionError, failure, fieldErrors, success } from "@/lib/action-state";
import {
  STATUS_TRANSITIONS,
  projectIdSchema,
  projectSchema,
  projectStatusSchema,
} from "@/lib/validations/projects";

const LIST = "/admin/projects";
const detail = (id) => `/admin/projects/${id}`;

function revalidateProject(id) {
  revalidatePath(LIST);
  revalidatePath(detail(id));
  revalidatePath("/admin/clients");
  revalidatePath("/admin/services");
}

export async function createProject(input) {
  try {
    const { supabase, profile } = await requireAdminAction();
    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) return failure("Check the highlighted fields.", fieldErrors(parsed.error));

    const { data, error } = await supabase
      .from("projects")
      .insert({ ...parsed.data, created_by: profile.id })
      .select("id")
      .single();
    if (error) return failure(error.message);

    revalidateProject(data.id);
    return success("Project created. Activate it to copy the template tasks.", { id: data.id });
  } catch (e) {
    return actionError(e);
  }
}

export async function updateProject(id, input) {
  try {
    const { supabase } = await requireAdminAction();
    if (!projectIdSchema.safeParse({ id }).success) return failure("Invalid project.");
    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) return failure("Check the highlighted fields.", fieldErrors(parsed.error));

    // The service cannot change once tasks were copied from it.
    const { data: current } = await supabase
      .from("projects")
      .select("status, service_id")
      .eq("id", id)
      .single();
    if (current && current.status !== "pending" && current.service_id !== parsed.data.service_id) {
      return failure("The service cannot be changed after activation.", {
        service_id: "Locked after activation",
      });
    }

    const { error } = await supabase.from("projects").update(parsed.data).eq("id", id);
    if (error) return failure(error.message);

    revalidateProject(id);
    return success("Project updated.");
  } catch (e) {
    return actionError(e);
  }
}

/**
 * pending → active, copying the service template in one DB transaction.
 * The RPC refuses a second activation, so a double click is harmless.
 */
export async function activateProject(id) {
  try {
    const { supabase } = await requireAdminAction();
    if (!projectIdSchema.safeParse({ id }).success) return failure("Invalid project.");

    const { data: created, error } = await supabase.rpc("activate_project", { p_project_id: id });
    if (error) return failure(error.message);

    revalidateProject(id);
    revalidatePath("/admin/tasks");
    // Activation may have assigned every template task to the lead.
    const { data: newTasks } = await supabase.from("tasks").select("id").eq("project_id", id);
    for (const t of newTasks ?? []) await dispatchPendingEmails(t.id);
    return success(
      created === 0
        ? "Project activated. The service has no template tasks yet."
        : `Project activated — ${created} task${created === 1 ? "" : "s"} created.`
    );
  } catch (e) {
    return actionError(e);
  }
}

/** Hold / resume / cancel / reopen, limited to STATUS_TRANSITIONS. */
export async function setProjectStatus(input) {
  try {
    const { supabase } = await requireAdminAction();
    const parsed = projectStatusSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid request.");
    const { id, status } = parsed.data;

    const { data: current, error: readError } = await supabase
      .from("projects")
      .select("status")
      .eq("id", id)
      .single();
    if (readError || !current) return failure("Project not found.");

    if (!STATUS_TRANSITIONS[current.status]?.includes(status)) {
      return failure(`Cannot move a ${current.status.replace("_", " ")} project to ${status.replace("_", " ")}.`);
    }

    const { error } = await supabase.from("projects").update({ status }).eq("id", id);
    if (error) return failure(error.message);

    revalidateProject(id);
    return success("Project status updated.");
  } catch (e) {
    return actionError(e);
  }
}

/** Deleting cascades to tasks, subtasks, comments and activity. */
export async function deleteProject(id) {
  try {
    const { supabase } = await requireAdminAction();
    if (!projectIdSchema.safeParse({ id }).success) return failure("Invalid project.");

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return failure(error.message);

    revalidateProject(id);
    revalidatePath("/admin/tasks");
    return success("Project deleted.");
  } catch (e) {
    return actionError(e);
  }
}
