import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Name is too short").max(80),
  job_title: z
    .string()
    .trim()
    .max(80)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

export const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

/** Notification event types shown on the Settings page. */
/** Keys match the `type` written by the DB notification triggers. */
export const NOTIFICATION_EVENTS = [
  { key: "task_assigned", label: "Task assigned", description: "When a task is assigned to you." },
  { key: "task_status_changed", label: "Task status changed", description: "When one of your tasks changes status (admins: any task)." },
  { key: "task_commented", label: "New comment", description: "When someone comments on one of your tasks (admins: employee comments)." },
];

const channelSchema = z.object({ email: z.boolean(), in_app: z.boolean() });

export const notificationPrefsSchema = z.object(
  Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e.key, channelSchema]))
);

/** Fills defaults (enabled) for keys missing from the stored jsonb. */
export function withPrefDefaults(stored) {
  const out = {};
  for (const e of NOTIFICATION_EVENTS) {
    out[e.key] = {
      email: stored?.[e.key]?.email ?? true,
      in_app: stored?.[e.key]?.in_app ?? true,
    };
  }
  return out;
}
