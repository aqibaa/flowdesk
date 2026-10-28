"use client";

import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/constants";
import { SearchInput } from "@/components/shared/search-input";
import { UrlSelect } from "@/components/shared/url-select";

/** Search + service / status / client filters, all URL-driven. */
export function ProjectsFilters({ options }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-soft lg:flex-row lg:items-center">
      <SearchInput placeholder="Search projects by name…" className="flex-1" />
      <div className="flex flex-wrap gap-2">
        <UrlSelect
          paramKey="service"
          allLabel="All services"
          className="w-44"
          options={options.services.map((s) => ({ value: s.id, label: s.title }))}
        />
        <UrlSelect
          paramKey="status"
          allLabel="All statuses"
          className="w-40"
          options={PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))}
        />
        <UrlSelect
          paramKey="client"
          allLabel="All clients"
          className="w-44"
          options={options.clients.map((c) => ({ value: c.id, label: c.company_name }))}
        />
      </div>
    </div>
  );
}
