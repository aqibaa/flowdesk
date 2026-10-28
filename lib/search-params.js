import { PAGE_SIZE } from "@/lib/constants";

/**
 * Helpers for URL-driven list state (rule: filters, search and pagination
 * live in search params). Pages pass the awaited `searchParams` object.
 */

/** Positive integer page number, defaulting to 1. */
export function parsePage(value) {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Trimmed search string or empty. */
export function parseQuery(value) {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}

/** Returns `value` if it is one of `allowed`, else null. */
export function parseEnum(value, allowed) {
  return allowed.includes(value) ? value : null;
}

/** Supabase `.range()` bounds for a page. */
export function pageRange(page, pageSize = PAGE_SIZE) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

/** Escapes % and _ so a user string can be used inside ilike patterns. */
export function ilikePattern(q) {
  return `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
}
