
/**
 * Shared result shape for Server Actions driven by useActionState:
 *   { ok: boolean, message?: string, errors?: Record<string, string> }
 */

/**
 * First message per dotted path, e.g. { email: "…", "tasks.2.title": "…" }.
 * Dotted paths match react-hook-form's setError() naming for nested fields.
 * @param {import("zod").ZodError} error
 */
export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export function failure(message, errors) {
  return { ok: false, message, errors };
}

export function success(message, extra = {}) {
  return { ok: true, message, ...extra };
}

/**
 * Turns thrown errors inside a Server Action into the action-state shape.
 * Guard errors keep their message; everything else is logged and masked.
 */
export function actionError(error) {
  if (error?.name === "AuthError") return failure(error.message);
  console.error(error);
  return failure("Something went wrong. Please try again.");
}

/** Converts a FormData into a plain object (first value per key). */
export function formToObject(formData) {
  const obj = {};
  for (const [key, value] of formData.entries()) {
    if (!(key in obj)) obj[key] = value;
  }
  return obj;
}
