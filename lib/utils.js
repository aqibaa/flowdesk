import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts (shadcn convention). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Initials for avatar badges — "Ahmad Khan" -> "AK", "ahmad" -> "A".
 * @param {string | null | undefined} name
 */
export function getInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Format a task number as the human-facing key, e.g. 123 -> "TSK-123". */
export function formatTaskKey(taskNumber) {
  return `TSK-${taskNumber}`;
}
