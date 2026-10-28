import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const optionalUuid = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.uuid().nullable()
);
const optionalDate = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.iso.date("Use a valid date").nullable()
);
const optionalHours = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().min(0, "Hours cannot be negative").max(9999).nullable()
);

/** Create task (from the dialog). */
export const taskCreateSchema = z.object({
  project_id: z.uuid("Choose a project"),
  title: z.string().trim().min(2, "Title is too short").max(200),
  description: optionalText(5000),
  status: z.enum(TASK_STATUSES).default("todo"),
  priority: z.enum(TASK_PRIORITIES).default("medium"),
  assignee_id: optionalUuid,
  due_date: optionalDate,
  estimated_hours: optionalHours,
});

/**
 * Partial update from the drawer: any subset of editable columns.
 * project_id is intentionally not editable (tasks never move between projects).
 */
export const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(2, "Title is too short").max(200),
    description: optionalText(5000),
    status: z.enum(TASK_STATUSES),
    priority: z.enum(TASK_PRIORITIES),
    assignee_id: optionalUuid,
    due_date: optionalDate,
    estimated_hours: optionalHours,
  })
  .partial();

/** Kanban drop: new status + new ordered ids for the destination column. */
export const taskMoveSchema = z.object({
  task_id: z.uuid(),
  status: z.enum(TASK_STATUSES),
  ordered_ids: z.array(z.uuid()).max(500),
});

export const taskIdSchema = z.object({ id: z.uuid() });

export const subtaskCreateSchema = z.object({
  task_id: z.uuid(),
  title: z.string().trim().min(1, "Enter a subtask").max(200),
});
export const subtaskToggleSchema = z.object({ id: z.uuid(), is_done: z.boolean() });
export const subtaskIdSchema = z.object({ id: z.uuid() });

export const commentCreateSchema = z.object({
  task_id: z.uuid(),
  body: z.string().trim().min(1, "Write a comment").max(4000),
});
