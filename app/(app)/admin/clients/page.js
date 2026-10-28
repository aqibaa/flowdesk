import { BuildingIcon, LayersIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { getClientDetail, getClientStats, listClients } from "@/lib/queries/clients";
import { parsePage, parseQuery } from "@/lib/search-params";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SearchInput } from "@/components/shared/search-input";
import { ClientFormDialog } from "@/components/forms/client-form-dialog";
import { ClientsTable } from "./clients-table";
import { ClientDetailPanel } from "./client-detail-panel";

export const metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const q = parseQuery(sp.q);
  const selectedId = typeof sp.client === "string" ? sp.client : null;

  const { supabase } = await requireAdmin();
  const [stats, { rows, total }, selected] = await Promise.all([
    getClientStats(supabase),
    listClients(supabase, { page, q }),
    selectedId ? getClientDetail(supabase, selectedId) : null,
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Clients"
        description="Directory of client accounts, purchased services and fulfilment progress."
        actions={<ClientFormDialog />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <KpiCard
          label="Total clients"
          value={stats.clients}
          unit="clients"
          icon={BuildingIcon}
          footnote="Registered client accounts"
        />
        <KpiCard
          label="Active projects"
          value={stats.activeProjects}
          unit="projects"
          icon={LayersIcon}
          tone="emerald"
          footnote="Engagements currently in delivery"
        />
      </div>

      <div className={selected ? "grid gap-6 xl:grid-cols-[1fr_360px]" : ""}>
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border bg-card p-3 shadow-soft">
            <SearchInput placeholder="Search by company, contact or email…" />
          </div>
          <ClientsTable rows={rows} total={total} page={page} selectedId={selectedId} />
        </div>
        {selected && <ClientDetailPanel client={selected} />}
      </div>
    </>
  );
}
