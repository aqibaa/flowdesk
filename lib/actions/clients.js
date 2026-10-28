"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/action-guards";
import { actionError, failure, fieldErrors, success } from "@/lib/action-state";
import { clientIdSchema, clientSchema } from "@/lib/validations/clients";

const PATH = "/admin/clients";

/** Create a client. `input` is the react-hook-form values object. */
export async function createClient(input) {
  try {
    const { supabase, profile } = await requireAdminAction();
    const parsed = clientSchema.safeParse(input);
    if (!parsed.success) return failure("Check the highlighted fields.", fieldErrors(parsed.error));

    const { data, error } = await supabase
      .from("clients")
      .insert({ ...parsed.data, created_by: profile.id })
      .select("id")
      .single();
    if (error) return failure(error.message);

    revalidatePath(PATH);
    return success("Client added.", { id: data.id });
  } catch (e) {
    return actionError(e);
  }
}

export async function updateClient(id, input) {
  try {
    const { supabase } = await requireAdminAction();
    const idParsed = clientIdSchema.safeParse({ id });
    const parsed = clientSchema.safeParse(input);
    if (!idParsed.success) return failure("Invalid client.");
    if (!parsed.success) return failure("Check the highlighted fields.", fieldErrors(parsed.error));

    const { error } = await supabase.from("clients").update(parsed.data).eq("id", id);
    if (error) return failure(error.message);

    revalidatePath(PATH);
    return success("Client updated.");
  } catch (e) {
    return actionError(e);
  }
}

/** Delete is refused by the FK (on delete restrict) while projects exist. */
export async function deleteClient(id) {
  try {
    const { supabase } = await requireAdminAction();
    if (!clientIdSchema.safeParse({ id }).success) return failure("Invalid client.");

    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      return failure(
        error.code === "23503"
          ? "This client still has projects. Delete or reassign them first."
          : error.message
      );
    }

    revalidatePath(PATH);
    return success("Client deleted.");
  } catch (e) {
    return actionError(e);
  }
}
