import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const setPasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export const inviteEmployeeSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  full_name: z.string().trim().min(2, "Name is too short").max(80),
  job_title: z.string().trim().max(80).optional().or(z.literal("")),
  role: z.enum(["admin", "employee"]).default("employee"),
});

export const updateRoleSchema = z.object({
  user_id: z.uuid(),
  role: z.enum(["admin", "employee"]),
});

export const setActiveSchema = z.object({
  user_id: z.uuid(),
  is_active: z.boolean(),
});
