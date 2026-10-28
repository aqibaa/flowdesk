import { z } from "zod";
import { PROJECT_STATUSES } from "@/lib/constants";

/** "" → null for optional selects/dates; keeps uuid/date validation otherwise. */
const optionalUuid = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.uuid().nullable()
);
const optionalDate = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.iso.date("Use a valid date").nullable()
);

export const projectSchema = z
  .object({
    name: z.string().trim().min(2, "Project name is too short").max(160),
    client_id: z.uuid("Choose a client"),
    service_id: z.uuid("Choose a service"),
    lead_id: optionalUuid,
    start_date: optionalDate,
    due_date: optionalDate,
  })
  .refine((v) => !v.start_date || !v.due_date || v.due_date >= v.start_date, {
    path: ["due_date"],
    message: "Due date must be on or after the start date",
  });

export const projectIdSchema = z.object({ id: z.uuid() });

/**
 * Manual status changes (hold / resume / cancel / reopen). Going from
 * `pending` to `active` is NOT done here — that is activate_project(), which
 * also copies the template. The action enforces the allowed transitions.
 */
export const projectStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(PROJECT_STATUSES),
});

/** Allowed manual transitions: from → [to]. */
export const STATUS_TRANSITIONS = {
  pending: ["cancelled"],
  active: ["on_hold", "cancelled"],
  on_hold: ["active", "cancelled"],
  completed: ["active"],
  cancelled: ["pending"],
};
