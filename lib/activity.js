import { PROJECT_STATUS_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";
import { formatTaskKey } from "@/lib/utils";

/**
 * Human sentence for one activity_log row (written by DB triggers).
 * `row` = { action, meta, actor?: {full_name}, task?: {task_number, title} }
 * `names` = optional map of profile id → full_name for assignee ids in meta.
 */
export function describeActivity(row, names = {}) {
  const actor = row.actor?.full_name ?? "System";
  const task = row.task ? formatTaskKey(row.task.task_number) : "a task";
  const meta = row.meta ?? {};

  switch (row.action) {
    case "task.created":
      return `${actor} created ${meta.task_number ? formatTaskKey(meta.task_number) : task}${meta.title ? ` “${meta.title}”` : ""}`;
    case "task.status_changed":
      return `${actor} moved ${task} from ${TASK_STATUS_LABELS[meta.from] ?? meta.from} to ${TASK_STATUS_LABELS[meta.to] ?? meta.to}`;
    case "task.assigned":
      return meta.to
        ? `${actor} assigned ${task} to ${names[meta.to] ?? "a team member"}`
        : `${actor} unassigned ${task}`;
    case "project.status_changed":
      return `${actor} changed the project from ${PROJECT_STATUS_LABELS[meta.from] ?? meta.from} to ${PROJECT_STATUS_LABELS[meta.to] ?? meta.to}`;
    default:
      return `${actor}: ${row.action}`;
  }
}
