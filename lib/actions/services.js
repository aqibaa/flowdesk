"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/action-guards";
import { actionError, failure, fieldErrors, success } from "@/lib/action-state";
import { serviceIdSchema, serviceSchema, templateSchema } from "@/lib/validations/services";

const PATH = "/admin/services";

export async function createService(input) {
  try {
    const { supabase } = await requireAdminAction();
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) return failure("Check the highlighted fields.", fieldErrors(parsed.error));

    const { data, error } = await supabase.from("services").insert(parsed.data).select("id").single();
    if (error) return failure(error.message);

    revalidatePath(PATH);
    return success("Service created.", { id: data.id });
  } catch (e) {
    return actionError(e);
  }
}

export async function updateService(id, input) {
  try {
    const { supabase } = await requireAdminAction();
    if (!serviceIdSchema.safeParse({ id }).success) return failure("Invalid service.");
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) return failure("Check the highlighted fields.", fieldErrors(parsed.error));

    const { error } = await supabase.from("services").update(parsed.data).eq("id", id);
    if (error) return failure(error.message);

    revalidatePath(PATH);
    return success("Service updated.");
  } catch (e) {
    return actionError(e);
  }
}

/** Quick toggle from the card switch. */
export async function setServicePublished(id, is_published) {
  try {
    const { supabase } = await requireAdminAction();
    if (!serviceIdSchema.safeParse({ id }).success) return failure("Invalid service.");

    const { error } = await supabase
      .from("services")
      .update({ is_published: Boolean(is_published) })
      .eq("id", id);
    if (error) return failure(error.message);

    revalidatePath(PATH);
    return success(is_published ? "Service published." : "Service unpublished.");
  } catch (e) {
    return actionError(e);
  }
}

/** Refused by the FK (on delete restrict) while projects reference it. */
export async function deleteService(id) {
  try {
    const { supabase } = await requireAdminAction();
    if (!serviceIdSchema.safeParse({ id }).success) return failure("Invalid service.");

    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      return failure(
        error.code === "23503"
          ? "This service is used by existing projects. Unpublish it instead."
          : error.message
      );
    }

    revalidatePath(PATH);
    return success("Service deleted.");
  } catch (e) {
    return actionError(e);
  }
}

/**
 * Save the ordered template in one transaction via replace_service_template().
 * Array order = position. Existing projects are NOT touched (templates are
 * copied at activation time only).
 */
export async function saveServiceTemplate(input) {
  try {
    const { supabase } = await requireAdminAction();
    const parsed = templateSchema.safeParse(input);
    if (!parsed.success) {
      // Field errors are keyed like "tasks.2.title" — pass them through.
      return failure("Check the highlighted tasks.", fieldErrors(parsed.error));
    }

    const { data, error } = await supabase.rpc("replace_service_template", {
      p_service_id: parsed.data.service_id,
      p_tasks: parsed.data.tasks.map((t) => ({
        id: t.id ?? null,
        title: t.title,
        description: t.description ?? null,
        estimated_hours: t.estimated_hours ?? null,
      })),
    });
    if (error) return failure(error.message);

    revalidatePath(PATH);
    return success("Template saved.", { tasks: data });
  } catch (e) {
    return actionError(e);
  }
}
