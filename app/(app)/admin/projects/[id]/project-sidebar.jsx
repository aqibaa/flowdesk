import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { MailIcon, PhoneIcon } from "lucide-react";
import { describeActivity } from "@/lib/activity";
import { Avatar } from "@/components/ui/avatar";

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

function Card({ title, children, aside }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading font-semibold">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Client card, project facts, recent activity. */
export function ProjectSidebar({ project, activity, names }) {
  const { client } = project;
  const totalHours = project.tasks.reduce((s, t) => s + Number(t.estimated_hours ?? 0), 0);

  return (
    <aside className="space-y-4">
      <Card
        title="Client"
        aside={
          <Link href={`/admin/clients?client=${client.id}`} className="text-xs text-primary hover:underline">
            Open
          </Link>
        }
      >
        <div className="mb-3 flex items-center gap-3">
          <Avatar name={client.company_name} size="lg" className="rounded-xl" />
          <p className="font-medium">{client.company_name}</p>
        </div>
        <div className="space-y-2 rounded-xl bg-muted/40 p-3">
          <Row label="Contact">{client.contact_name ?? "—"}</Row>
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
        </div>
        {client.notes && (
          <p className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">{client.notes}</p>
        )}
      </Card>

      <Card title="Details">
        <div className="space-y-2">
          <Row label="Service">{project.service.title}</Row>
          <Row label="Lead">{project.lead?.full_name ?? "Unassigned"}</Row>
          <Row label="Start">{project.start_date ? format(new Date(project.start_date), "d MMM yyyy") : "—"}</Row>
          <Row label="Due">{project.due_date ? format(new Date(project.due_date), "d MMM yyyy") : "—"}</Row>
          <Row label="Tasks">{project.tasks.length}</Row>
          <Row label="Estimated">{totalHours}h</Row>
          <Row label="Created">{format(new Date(project.created_at), "d MMM yyyy")}</Row>
        </div>
      </Card>

      <Card title="Recent activity">
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <ol className="space-y-3">
            {activity.map((row) => (
              <li key={row.id} className="flex gap-3">
                <Avatar name={row.actor?.full_name ?? "System"} size="sm" className="mt-0.5" />
                <div className="min-w-0 text-sm">
                  <p className="leading-snug">{describeActivity(row, names)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </aside>
  );
}
