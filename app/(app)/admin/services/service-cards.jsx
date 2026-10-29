"use client";

import { useTransition } from "react";
import { LayersIcon, ListChecksIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useUrlState } from "@/hooks/use-url-state";
import { deleteService, setServicePublished } from "@/lib/actions/services";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ServiceFormDialog } from "@/components/forms/service-form-dialog";

function PublishedSwitch({ service }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      Published
      <Switch
        checked={service.is_published}
        disabled={pending}
        onCheckedChange={(v) =>
          start(async () => {
            const res = await setServicePublished(service.id, v);
            res.ok ? toast.success(res.message) : toast.error(res.message);
          })
        }
        aria-label={`Toggle ${service.title} published`}
      />
    </label>
  );
}

function ServiceCard({ service, selected }) {
  const { set } = useUrlState();
  const openEditor = () => set({ service: service.id });

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-soft transition",
        selected && "ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <LayersIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg font-semibold leading-tight">{service.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant={service.is_published ? "completed" : "secondary"}>
              {service.is_published ? "Published" : "Draft"}
            </Badge>
            {service.active_project_count > 0 && (
              <Badge variant="active">{service.active_project_count} active projects</Badge>
            )}
            {service.template_tasks.length === 0 && (
              <Badge variant="in_review">No template tasks</Badge>
            )}
          </div>
        </div>
        <PublishedSwitch service={service} />
      </div>

      {service.description && (
        <p className="line-clamp-3 text-sm text-muted-foreground">{service.description}</p>
      )}

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center">
        <div>
          <p className="font-heading text-lg font-bold">{service.template_tasks.length}</p>
          <p className="text-[11px] text-muted-foreground">Template tasks</p>
        </div>
        <div>
          <p className="font-heading text-lg font-bold">{service.template_hours}h</p>
          <p className="text-[11px] text-muted-foreground">Estimated</p>
        </div>
        <div>
          <p className="font-heading text-lg font-bold">{service.project_count}</p>
          <p className="text-[11px] text-muted-foreground">Projects total</p>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <ServiceFormDialog
          service={service}
          trigger={
            <Button variant="outline" size="sm">
              <PencilIcon /> Edit
            </Button>
          }
        />
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={service.project_count > 0}>
              <Trash2Icon /> Delete
            </Button>
          }
          title={`Delete ${service.title}?`}
          description="The service and its template tasks are removed. Services used by projects cannot be deleted — unpublish instead."
          confirmLabel="Delete service"
          destructive
          onConfirm={() => deleteService(service.id)}
        />
        <Button size="sm" className="ml-auto" onClick={openEditor}>
          <ListChecksIcon /> Edit template
        </Button>
      </div>
    </article>
  );
}

export function ServiceCards({ services, selectedId }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold">
          Catalogue <span className="ml-1 text-sm font-normal text-muted-foreground">{services.length} services</span>
        </h2>
        <ServiceFormDialog />
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={LayersIcon}
          title="No services yet"
          description="Create a service, then define the template tasks that every project of that type starts with."
          action={<ServiceFormDialog />}
        />
      ) : (
        <div className={cn("grid gap-4", selectedId ? "md:grid-cols-1 2xl:grid-cols-2" : "md:grid-cols-2")}>
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} selected={s.id === selectedId} />
          ))}
        </div>
      )}
    </section>
  );
}
