"use client";

import { KanbanSquareIcon, ListIcon } from "lucide-react";
import { useUrlState } from "@/hooks/use-url-state";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/shared/search-input";
import { UrlSelect } from "@/components/shared/url-select";

function ViewButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-4" /> {label}
    </button>
  );
}

/** View toggle + project / assignee / priority (+ status in list view) filters. */
export function TasksToolbar({ view, options }) {
  const { set } = useUrlState();
  const switchView = (value) => set({ view: value === "board" ? null : value, page: null, status: null });

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-soft lg:flex-row lg:items-center">
      <div className="inline-flex shrink-0 rounded-xl bg-muted p-1">
        <ViewButton active={view === "board"} icon={KanbanSquareIcon} label="Kanban Board" onClick={() => switchView("board")} />
        <ViewButton active={view === "list"} icon={ListIcon} label="Task List" onClick={() => switchView("list")} />
      </div>
      <SearchInput placeholder="Filter tasks by title…" className="flex-1" />
      <div className="flex flex-wrap gap-2">
        <UrlSelect
          paramKey="project"
          allLabel="All projects"
          className="w-52"
          options={options.projects.map((p) => ({ value: p.id, label: `${p.name}` }))}
        />
        <UrlSelect
          paramKey="assignee"
          allLabel="All assignees"
          className="w-44"
          options={[
            { value: "unassigned", label: "Unassigned" },
            ...options.people.map((u) => ({ value: u.id, label: u.full_name })),
          ]}
        />
        <UrlSelect
          paramKey="priority"
          allLabel="All priorities"
          className="w-40"
          options={TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))}
        />
        {view === "list" && (
          <UrlSelect
            paramKey="status"
            allLabel="All statuses"
            className="w-40"
            options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
          />
        )}
      </div>
    </div>
  );
}
