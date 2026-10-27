/**
 * Enum values mirror the Postgres enums in supabase/migrations.
 * Keep these in sync with the database — they are the single source for
 * labels, ordering and Badge variants in the UI.
 */

export const APP_ROLES = ["admin", "employee"];

export const TASK_STATUSES = ["todo", "in_progress", "in_review", "completed"];
export const TASK_STATUS_LABELS = {
  todo: "To-Do",
  in_progress: "In Progress",
  in_review: "In Review",
  completed: "Completed",
};

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];
export const TASK_PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PROJECT_STATUSES = [
  "pending",
  "active",
  "on_hold",
  "completed",
  "cancelled",
];
export const PROJECT_STATUS_LABELS = {
  pending: "Pending",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Server-side pagination size for every list. */
export const PAGE_SIZE = 10;

/** Kanban column cap before "Load more". */
export const KANBAN_COLUMN_LIMIT = 10;

/** Hours per week that count as 100% workload on the Team page. */
export const FULL_WORKLOAD_HOURS = 40;
