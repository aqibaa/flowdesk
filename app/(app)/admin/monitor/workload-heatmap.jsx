import Link from "next/link";
import { FULL_WORKLOAD_HOURS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { workloadStatus } from "@/lib/workload";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** Cell tone by hours due that day (estimated hours of open tasks). */
function cellTone(h) {
  if (h === 0) return "bg-muted/40 text-muted-foreground";
  if (h <= 4) return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
  if (h <= 8) return "bg-blue-500 text-white";
  return "bg-rose-500 text-white";
}

/** Mon–Fri heatmap of estimated hours due per employee + weekly total. */
export function WorkloadHeatmap({ days, rows }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
        <div>
          <h2 className="font-heading font-semibold">Specialist workload heatmap</h2>
          <p className="text-xs text-muted-foreground">
            Estimated hours of open tasks due each day this week · {FULL_WORKLOAD_HOURS}h/week = 100%
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="size-3 rounded bg-blue-100 dark:bg-blue-500/20" /> ≤4h</span>
          <span className="inline-flex items-center gap-1"><span className="size-3 rounded bg-blue-500" /> ≤8h</span>
          <span className="inline-flex items-center gap-1"><span className="size-3 rounded bg-rose-500" /> &gt;8h</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">No active employees yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Employee</TableHead>
              {days.map((d) => (
                <TableHead key={d.date} className="text-center">{d.label}</TableHead>
              ))}
              <TableHead className="text-center">Total week</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const status = workloadStatus(r.workload_percent);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/admin/tasks?assignee=${r.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar name={r.full_name} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.job_title ?? `${r.open_task_count} open tasks`}</p>
                      </div>
                    </Link>
                  </TableCell>
                  {r.daily.map((h, i) => (
                    <TableCell key={i} className="text-center">
                      <span className={cn("inline-flex min-w-10 justify-center rounded-md px-2 py-1 text-xs font-semibold", cellTone(h))}>
                        {h ? `${h}h` : "—"}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    <span className={cn("font-heading font-bold", r.workload_percent > 100 ? "text-rose-600 dark:text-rose-400" : r.workload_percent >= 85 ? "text-amber-600" : "text-primary")}>
                      {r.hours_due_this_week}h
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
