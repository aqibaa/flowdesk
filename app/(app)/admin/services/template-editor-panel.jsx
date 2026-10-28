"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { XIcon } from "lucide-react";
import { useUrlState } from "@/hooks/use-url-state";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// dnd-kit is only needed here, so it is split out of the main bundle.
const TemplateEditor = dynamic(
  () => import("./template-editor").then((m) => m.TemplateEditor),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    ),
  }
);

/** Right-hand panel: ordered template editor + projects using the service. */
export function TemplateEditorPanel({ service, projects }) {
  const { set } = useUrlState();

  return (
    <aside className="h-fit space-y-4 xl:sticky xl:top-28">
      <div className="rounded-2xl border bg-card p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
              Template tasks
            </p>
            <h2 className="mt-1 font-heading text-lg font-semibold leading-tight">{service.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Copied, in this order, into every project when it is activated. Existing projects are not changed.
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => set({ service: null })} aria-label="Close">
            <XIcon />
          </Button>
        </div>
        <div className="mt-4">
          <TemplateEditor serviceId={service.id} initialTasks={service.template_tasks} />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading font-semibold">Projects on this service</h3>
          <span className="text-xs text-muted-foreground">{service.project_count} total</span>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects use this service yet.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.id} className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/admin/projects/${p.id}`} className="block truncate text-sm font-medium hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.client?.company_name}</p>
                  </div>
                  <Badge variant={p.status}>{PROJECT_STATUS_LABELS[p.status]}</Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Progress value={p.progress_percent} className="h-1.5" />
                  <span className="text-xs font-semibold text-primary">{p.progress_percent}%</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
