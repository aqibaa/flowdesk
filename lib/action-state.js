import { z } from "zod";

/**
 * Shared result shape for Server Actions driven by useActionState:
 *   { ok: boolean, message?: string, errors?: Record<string, string> }
 */

/** @param {z.ZodError} error */
export function fieldErrors(error) {
  const flat = z.flattenError(error).fieldErrors;
  const out = {};
  for (const [key, msgs] of Object.entries(flat)) {
    if (msgs?.length) out[key] = msgs[0];
  }
  return out;
}

export function failure(message, errors) {
  return { ok: false, message, errors };
}

export function success(message, extra = {}) {
  return { ok: true, message, ...extra };
}

/** Converts a FormData into a plain object (first value per key). */
export function formToObject(formData) {
  const obj = {};
  for (const [key, value] of formData.entries()) {
    if (!(key in obj)) obj[key] = value;
  }
  return obj;
}
