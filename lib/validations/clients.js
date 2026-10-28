import { z } from "zod";

/** Empty strings from inputs become null so optional columns stay NULL. */
const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const clientSchema = z.object({
  company_name: z.string().trim().min(2, "Company name is too short").max(120),
  contact_name: optionalText(120),
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .pipe(z.email("Enter a valid email address").nullable())
    .nullable()
    .optional(),
  phone: optionalText(40),
  notes: optionalText(2000),
});

export const clientIdSchema = z.object({ id: z.uuid() });
