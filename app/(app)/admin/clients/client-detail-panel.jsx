"use client";

import Link from "next/link";
import { FolderKanbanIcon, MailIcon, PencilIcon, PhoneIcon, Trash2Icon, XIcon } from "lucide-react";
import { format } from "date-fns";
import { useUrlState } from "@/hooks/use-url-state";
import { deleteClient } from "@/lib/actions/clients";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ClientFormDialog } from "@/components/forms/client-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

/** Right-hand detail card for the selected client (URL: ?client=<id>). */
export function ClientDetailPanel({ client }) {
  const { set } = useUrlState();
  const close = () => set({ client: null });
  const activeCount = client.projects.filter((p) => p.status === "active").length;

  return (
    <aside className="h-fit rounded-2xl border bg-card p-5 shadow-soft xl:sticky xl:top-28">
      <div className="flex items-start gap-3">
        <Avatar name={client.company_name} size="lg" className="rounded-xl" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-heading text-lg font-semibold">{client.company_name}</h2>
          <Badge variant={activeCount > 0 ? "completed" : "secondary"} className="mt-1">
            {activeCount > 0 ? "Active" : "No active projects"}
          </Badge>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close">
          <XIcon />
        </Button>
      </div>

      <section className="mt-5">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Contact info
        </h3>
        <div className="space-y-2 rounded-xl bg-muted/40 p-3">
          <Row label="Primary contact">{client.contact_name ?? "—"}</Row>
          <Row label="Email">
            {client.email ? (
              <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                <MailIcon className="size-3.5" /> {client.email}
              </a>
            ) : "—"}
          </Row>
          <Row label="Phone">
            {client.phone ? (
              <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                <PhoneIcon className="size-3.5" /> {client.phone}
              </a>
            ) : "—"}
          </Row>
          <Row label="Client since">{format(new Date(client.created_at), "MMMM yyyy")}</Row>
        </div>
        {client.notes && (
          <p className="mt-3 whitespace-pre-wrap rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
            {client.notes}
          </p>
        )}
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Projects
          </h3>
          <span className="text-xs text-primary">{activeCount} active</span>
        </div>
        {client.projects.length === 0 ? (
          <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
            No projects yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {client.projects.map((p) => (
              <li key={p.id} className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/admin/projects/${p.id}`} className="text-sm font-medium hover:underline">
                    {p.name}
                  </Link>
                  <span className="text-xs font-semibold text-primary">{p.progress_percent}%</span>
                </div>
                <Progress value={p.progress_percent} className="mt-2 h-1.5" />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.service?.title} · Lead: {p.lead?.full_name ?? "Unassigned"}</span>
                  <Badge variant={p.status}>{PROJECT_STATUS_LABELS[p.status]}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <ClientFormDialog
          client={client}
          trigger={
            <Button variant="outline" className="w-full">
              <PencilIcon /> Edit
            </Button>
          }
        />
        <ConfirmDialog
          trigger={
            <Button variant="outline" className="w-full text-destructive hover:text-destructive" disabled={client.projects.length > 0}>
              <Trash2Icon /> Delete
            </Button>
          }
          title={`Delete ${client.company_name}?`}
          description="This removes the client record. Clients with projects cannot be deleted."
          confirmLabel="Delete client"
          destructive
          onConfirm={async () => {
            const res = await deleteClient(client.id);
            if (res.ok) close();
            return res;
          }}
        />
      </div>
      <Button asChild variant="ghost" className="mt-2 w-full">
        <Link href={`/admin/projects?client=${client.id}`}>
          <FolderKanbanIcon /> View all projects
        </Link>
      </Button>
    </aside>
  );
}
