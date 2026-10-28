import Link from "next/link";
import { AlertCircleIcon, ShieldCheckIcon } from "lucide-react";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/** Top-5 at-risk / overdue projects. */
export function AtRiskCard({ projects }) {
  return (
    <aside className="h-fit rounded-2xl border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-rose-500" />
          <h2 className="font-heading font-semibold">At-risk &amp; overdue</h2>
        </div>
        <div className="flex items-center gap-2">
          {projects.length > 0 && <Badge variant="urgent">{projects.length} flagged</Badge>}
          <Link href="/admin/projects?status=active" className="text-xs text-primary hover:underline">View all</Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <ShieldCheckIcon className="size-5 text-emerald-500" /> Nothing at risk right now.
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => {
            const overdue = p.reason.startsWith("Overdue");
            return (
              <li key={p.id} className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/admin/projects/${p.id}`} className="block truncate text-sm font-semibold hover:underline">
                      {p.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.client?.company_name} · {p.service?.title}
                    </p>
                  </div>
                  {p.lead ? <Avatar name={p.lead.full_name} size="sm" /> : <Badge variant={p.status}>{PROJECT_STATUS_LABELS[p.status]}</Badge>}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Progress value={p.progress_percent} className="h-1.5" indicatorClassName={cn(overdue && "bg-rose-500")} />
                  <span className={cn("w-9 text-right text-xs font-semibold", overdue ? "text-rose-600 dark:text-rose-400" : "text-primary")}>
                    {p.progress_percent}%
                  </span>
                </div>
                <p className={cn("mt-1.5 text-[11px] font-medium", overdue ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400")}>
                  {p.reason}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
