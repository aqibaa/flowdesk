# FlowDesk

Internal service-delivery and project-tracking tool for a digital agency.
Two roles — **admin** and **employee** — no client portal.

- Admin: clients, service templates, projects (activate → template tasks are
  copied), Jira-style task board, dashboard, global monitor, team workload,
  settings.
- Employee: only their own tasks (dashboard, grouped list, personal board),
  status changes through a guarded RPC. Project progress is recalculated by
  database triggers.

**Stack:** Next.js 16 (App Router, plain JavaScript), Tailwind v4 + shadcn/ui,
Supabase (Postgres + Auth + RLS), Zod + react-hook-form, dnd-kit, Recharts,
Zustand (UI state only). Deployed on Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the Supabase values
npm run dev                  # http://localhost:3000
```

Apply `supabase/migrations/*.sql` in order to your Supabase project (and
optionally `supabase/seed.sql` for demo data), create the first admin as
described in `CLAUDE.md`, then sign in.

## Scripts

| command | purpose |
|---|---|
| `npm run dev` | dev server (Turbopack) |
| `npm run build` | production build — must pass before merging |
| `npm run lint` | ESLint (next/core-web-vitals + React 19 rules) |

## Where to look

- `CLAUDE.md` — full architecture, schema, RLS matrix, conventions, phase log.
- `docs/DEPLOY.md` — production checklist (Supabase + Vercel).
- `docs/design/` — UI mockups the pages follow.
- `supabase/migrations/` — the only way the database changes.
