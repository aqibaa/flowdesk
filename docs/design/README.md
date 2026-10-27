# Design references (trimmed set, 27 Oct 2026)

Screenshots supplied by the product owner. They are the **visual direction**
(layout, spacing, chips, cards, sidebar/top bar) and are already trimmed to
roughly the data the schema has. Where a mockup still shows something the
schema does not have (e.g. "+4 this month" deltas, "Updated real-time",
"View client portal", sprint numbers, timezone), rule 7 in `CLAUDE.md` wins:
leave it out or replace it with a real figure.

| file | route | notes |
|---|---|---|
| `dashboard.png` | `/admin` | 4 KPIs, tasks-completed line, projects-by-service donut, at-risk list |
| `global-monitor.png` | `/admin/monitor` | 3 KPIs, top-5 project cards (phase pipeline = the project's tasks in position order), workload heatmap |
| `projects.png` | `/admin/projects` | mockup calls it **Orders**; the app uses the spec's name **Projects** (`/admin/projects`). Table + Activate action |
| `tasks.png` | `/admin/tasks` | Kanban + List toggle, filters, right drawer with subtasks + comments |
| `services.png` | `/admin/services` | service cards + template editor panel |
| `team.png` | `/admin/team` | roster with workload meter, invite button |
| `clients.png` | `/admin/clients` | 2 KPIs, table, detail panel listing projects with progress |
| `settings.png` | `/admin/settings` | Profile / Roles & Access / Notifications |
| `reports.png` | — | not in the route spec; parked. Can be added after Phase 8 if wanted (all its numbers exist in the schema). |

Shared shell (all mockups): white sidebar, violet logo tile, role pill,
text nav with filled-violet active item, user card pinned at the bottom;
top bar with search (⌘K), "+ New Project" (mockup: "New Order"), bell,
dark-mode toggle, avatar; breadcrumb strip "Portal"; lavender-grey page bg.
