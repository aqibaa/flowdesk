import { z } from "zod";

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

/** Numeric input arrives as "" | "4" | 4; normalise to number|null. */
const optionalHours = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().min(0, "Hours cannot be negative").max(9999).nullable()
);

export const serviceSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(120),
  description: optionalText(1000),
  is_published: z.boolean().default(true),
});

export const templateTaskSchema = z.object({
  id: z.uuid().optional(), // present for existing rows
  title: z.string().trim().min(2, "Title is too short").max(200),
  description: optionalText(1000),
  estimated_hours: optionalHours,
});

/** The whole ordered template; position is derived from array index. */
export const templateSchema = z.object({
  service_id: z.uuid(),
  tasks: z.array(templateTaskSchema).max(100, "Templates are limited to 100 tasks"),
});

export const serviceIdSchema = z.object({ id: z.uuid() });
