/** Status label from the weekly workload % (40h = 100%). Shared by Team + Monitor. */
export function workloadStatus(percent) {
  if (percent > 100) return { label: "Overloaded", variant: "urgent" };
  if (percent >= 85) return { label: "High load", variant: "in_review" };
  if (percent >= 50) return { label: "Optimal", variant: "completed" };
  return { label: "Available", variant: "in_progress" };
}
