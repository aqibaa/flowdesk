# FlowDesk — project guide for Claude Code

Internal service-delivery and project-tracking tool for a digital agency
(web development, SEO, design). Keep this file updated as phases land.

## Product in one paragraph

Two roles only: **admin** and **employee**. Clients never log in. The admin
enters clients and projects by hand, creates projects from **service
templates**, activates them (which copies the template tasks), assigns tasks
on a Jira-like board, and monitors progress and workload. Employees see
**only their own assigned tasks**, grouped by client → project, and move them
`todo → in_progress → in_review → completed`. Project `progress_percent` is
recalculated **in the database by trigger** whenever a task changes.
Employees have zero visibility into other employees' tasks, client details,
or admin pages.

## Stack (fixed — do not substitute)

- Next.js **16** App Router, **plain JavaScript** (`.js` / `.jsx`, JSDoc where
  useful). No TypeScript.
- Tailwind CSS **v4** (CSS-first config in `app/globals.css`), shadcn/ui
  components hand-copied as JSX in `components/ui/` (Radix via the `radix-ui`
  package), Lucide icons, `next-themes` for dark mode, `sonner` for toasts.
- Supabase: Postgres + Auth + RLS via `@supabase/supabase-js` and
  `@supabase/ssr`.
- Zod v4 + react-hook-form (`@hookform/resolvers`), `@dnd-kit/*` for Kanban,
  Recharts lazy-loaded with `next/dynamic`, Zustand for UI-only state.
- Deploy: Vercel. **No Prisma, no Clerk.**

### Next.js 16 notes
- Middleware file is **`proxy.js`** (exports `proxy`), not `middleware.js`.
- `cacheComponents` / `partialPrefetching` are **off** (`next.config.mjs`):
  every page is dynamic and auth-gated, so there is no static shell to
  prerender. Freshness comes from `revalidatePath` after Server Actions.
- `cookies()`, `headers()`, `params`, `searchParams` are **async** — `await` them.
- Docs for this exact version live in `node_modules/next/dist/docs/`.
- shadcn's CLI could not reach `ui.shadcn.com` from the build sandbox, so the
  primitives in `components/ui/` were written by hand from the shadcn source.
  `components.json` is configured (`tsx: false`), so `npx shadcn@latest add
  <name>` works locally if more primitives are needed — convert to `.jsx`.

## Folder structure

```
app/
  layout.js                 root layout: fonts, ThemeProvider, Toaster
  page.js                   -> redirect /dashboard
  dashboard/page.js         role router: admin -> /admin, employee -> /employee
  (auth)/login/page.js      email + password login
  auth/                     auth callback / confirm routes (invite flow)
  (app)/admin/...           admin routes (layout re-checks role)
  (app)/employee/...        employee routes
components/
  ui/                       shadcn primitives (button, card, dialog, sheet, ...)
  layout/                   sidebar, top bar, shell
  shared/                   status chips, empty states, pagination, avatars
  forms/                    react-hook-form forms (client, project, task, ...)
  providers/                theme provider
lib/
  supabase/client.js        browser client (publishable key)
  supabase/server.js        server client bound to request cookies (RLS applies)
  supabase/admin.js         `import "server-only"` secret-key client (auth.admin)
  supabase/proxy.js         session refresh + /login redirect for proxy.js
  auth/                     getCurrentProfile, requireAdmin, requireUser
  actions/                  Server Actions (one file per domain)
  queries/                  server-side read helpers (one file per domain)
  validations/              Zod schemas, shared by forms + actions
  stores/                   Zustand UI stores (client components only)
  constants.js              enum values, labels, PAGE_SIZE, workload constants
  utils.js                  cn(), getInitials(), formatTaskKey()
hooks/                      client hooks
supabase/
  migrations/               timestamped SQL files — the ONLY way to change DB
  seed.sql                  demo data (Phase 1)
proxy.js                    Next.js 16 proxy (middleware)
.env.example                env var names only (+ optional NEXT_PUBLIC_SITE_URL)
docs/design/                mockup screenshots + README (visual direction)
```

## Working rules (strict)

1. Keep `CLAUDE.md` current when structure, schema or rules change.
2. Work **phase by phase**. After each phase: summarize what was built, list
   what the user must run/test, then **stop** and wait for "continue".
3. Database changes **only** as timestamped SQL files in
   `supabase/migrations/` (`YYYYMMDDHHMMSS_name.sql`). Never destructive SQL.
   The Supabase MCP is **read-only** and scoped to the DEV project — use it to
   inspect/verify. The user applies migrations; always give the exact command.
4. Never read, print or commit `.env*` files. Env vars:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY`. The secret key is used only in `lib/supabase/admin.js`
   (`import "server-only"`) for admin tasks like inviting employees. It must
   never reach a Client Component.
5. Server-side auth uses `supabase.auth.getUser()` or `getClaims()`, **never
   `getSession()`**. Every mutation is a Server Action:
   `authenticate → check role (profiles.role) → validate with Zod → write →
   revalidatePath`. RLS is the real wall; app checks are the second layer.
   Never trust `user_metadata` for roles.
6. Performance: Server Components by default; server-side pagination
   (`PAGE_SIZE = 10`); lazy-load Recharts and dnd-kit only where used; no
   polling (Global Monitor has a manual refresh button); initials avatars,
   no photos; no sparklines; `loading.js` skeleton per route; the indexes
   below.
7. Show only data that exists in the schema — no revenue, margins, NPS,
   invoices or third-party integrations.
8. Small modular components, one file per concern, comments on non-obvious
   logic, consistent naming, no dead code.

## State & data rules

- Server data: fetched in Server Components, mutated by Server Actions +
  `revalidatePath`. Never copy DB data into a global client store.
- Zustand is **UI state only** (sidebar collapsed, selected task id / drawer
  open). Stores are created in client components, never as server singletons.
- Filters, search and pagination live in URL search params.
- Kanban drag uses `useOptimistic`; revert on error.
- Complex forms: react-hook-form + `zodResolver` (task, project, client,
  service template with `useFieldArray`). Simple forms: native
  `<form action>` + `useActionState`. The same Zod schema is reused inside
  the Server Action.
- `@dnd-kit/core` + `@dnd-kit/sortable` only on the Tasks page and the
  template editor, lazy-loaded.

## UI direction

Modern SaaS: violet/indigo primary (`#6366F1 → #8B5CF6`), colorful status
chips (todo slate, in_progress blue, in_review amber, completed emerald;
urgent rose — see `Badge` variants), `rounded-2xl` cards with the `shadow-soft`
utility, Plus Jakarta Sans for headings (`font-heading`) and Inter for body,
light + dark mode. Use `components/ui/*` everywhere.

## Database schema (Postgres, schema `public`, RLS on every table)

Enums: `app_role (admin, employee)` · `project_status (pending, active,
on_hold, completed, cancelled)` · `task_status (todo, in_progress, in_review,
completed)` · `task_priority (low, medium, high, urgent)`

| table | columns |
|---|---|
| `profiles` | `id uuid PK → auth.users (cascade)`, `full_name`, `email unique`, `role app_role not null default 'employee'`, `job_title`, `is_active bool default true`, `created_at`. Created by trigger on `auth.users` insert. **`profiles.role` is the only source of truth for role.** |
| `clients` | `id`, `company_name not null`, `contact_name`, `email`, `phone`, `notes`, `created_by → profiles`, `created_at`, `updated_at` |
| `services` | `id`, `title not null`, `description`, `is_published default true`, `created_at` |
| `service_template_tasks` | `id`, `service_id → services (cascade)`, `title`, `description`, `estimated_hours numeric`, `position int` |
| `projects` | `id`, `client_id → clients`, `service_id → services`, `name not null`, `status project_status default 'pending'`, `progress_percent int default 0 check 0..100`, `lead_id → profiles`, `start_date`, `due_date`, `created_by → profiles`, `created_at`, `updated_at` |
| `tasks` | `id`, `task_number bigint generated always as identity` (shown as `TSK-123`), `project_id → projects (cascade)`, `title not null`, `description`, `status task_status default 'todo'`, `priority task_priority default 'medium'`, `assignee_id → profiles (nullable)`, `reporter_id → profiles`, `due_date`, `estimated_hours numeric`, `position int`, `created_at`, `updated_at`, `completed_at` |
| `task_subtasks` | `id`, `task_id → tasks (cascade)`, `title`, `is_done default false`, `position` |
| `task_comments` | `id`, `task_id → tasks (cascade)`, `author_id → profiles`, `body not null`, `created_at` |
| `activity_log` | `id`, `actor_id → profiles`, `project_id`, `task_id`, `action text`, `meta jsonb`, `created_at` |

Indexes: `tasks(assignee_id, status)`, `tasks(project_id, status)`,
`projects(client_id)`, `projects(status)`, `task_comments(task_id)`,
`activity_log(project_id, created_at desc)`. `updated_at` triggers on tables
that have the column.

### Database logic (SQL, not app code)
1. `recalc_project_progress(project_id)` = `round(100 * completed / total)`,
   0 if no tasks; called from an AFTER INSERT / UPDATE OF status / DELETE
   trigger on `tasks`. 100% + `active` → `completed`; <100% + `completed` →
   `active`.
2. `completed_at` trigger: set when status becomes `completed`, cleared otherwise.
3. `activate_project(project_id)` RPC (admin only, one transaction): status →
   `active`, copies the service's template tasks into `tasks` (unassigned,
   `todo`, reporter = caller). Idempotent: refuses if already activated.
4. `update_my_task_status(task_id, new_status)` RPC (security definer):
   allowed only if `tasks.assignee_id = auth.uid()`; updates ONLY status.
   Employees have NO direct UPDATE policy on `tasks`.
5. `activity_log` rows are written by triggers on task status / assignee changes.
6. View `employee_tasks_view` (security definer, filtered by
   `assignee_id = auth.uid()`): task fields + project name + client
   `company_name` only (never client email/phone/notes). `GRANT SELECT TO
   authenticated`, `REVOKE FROM anon`.
7. Admin-only views for dashboard/Team: per-employee open task count and sum
   of `estimated_hours` of open tasks due this week (workload %, 40h = 100%).

### RLS matrix
- `is_admin()` helper (security definer, reads `profiles.role` for `auth.uid()`).
- `profiles`: everyone reads own row; admin reads/updates all; nobody can
  change their own role.
- `clients`, `services`, `service_template_tasks`, `projects`: admin full;
  employees no direct access.
- `tasks`: admin full; employee SELECT where `assignee_id = auth.uid()`; no
  employee INSERT/UPDATE/DELETE.
- `task_subtasks`, `task_comments`: admin full; employee read, and insert
  comments, only on tasks assigned to them.
- `activity_log`: admin read; no direct writes (triggers only).
- Anon: nothing.

## Auth flow
- Email + password login; public signup disabled in the Supabase dashboard.
- Admin invites employees (Team → Invite Employee) via a Server Action using
  `auth.admin.inviteUserByEmail` (secret key), then sets role / job title.
  Admin can deactivate users.
- First admin: create the user in the Supabase dashboard (Authentication →
  Users → Add user, auto-confirm), then in the SQL editor:
  `update public.profiles set role = 'admin' where email = '<that email>';`
  (The `profiles_protect_role` trigger allows this because there is no JWT.)
- `/dashboard` redirects by role. `proxy.js` refreshes the session and sends
  anonymous users to `/login`. Admin layout and every admin Server Action
  re-check the role; an employee hitting `/admin/*` is redirected to `/employee`.

## Routes
Shared shell: sidebar (Dashboard, Global Monitor, Projects, Tasks, Services,
Team, Clients, Settings) + top bar (search, "+ New Project", notifications,
dark mode, avatar menu).

| route | content |
|---|---|
| `/login` | email + password |
| `/admin` | 4 KPIs (clients, active projects, employees, overall progress), tasks-completed chart, projects-by-service donut, top-5 at-risk/overdue |
| `/admin/monitor` | top-5 project cards (progress, status chip, due date, assignees) + workload heatmap, manual refresh |
| `/admin/projects` | table (client, project, service, progress, status, lead, due), filters, pagination, Activate, create/edit modal |
| `/admin/projects/[id]` | detail: progress, task list, client info |
| `/admin/tasks` | Kanban + List, project dropdown, filters (assignee, priority), create task, right drawer (title, description, status, priority, assignee, due date, estimated hours, subtasks, comments, activity), DnD between columns, 10 cards/column + "Load more" |
| `/admin/services` | service cards + drawer to edit ordered task template |
| `/admin/team` | employee list with workload meter, invite modal |
| `/admin/clients` | table + add/edit form + detail drawer listing projects with progress |
| `/admin/settings` | profile, roles & access, notification toggles |
| `/employee` | my open tasks count, due soon, completed this week |
| `/employee/tasks` | my tasks grouped by client → project, status dropdown / quick-complete, drawer with subtasks + comments |

Loading states, empty states, error boundaries and toasts everywhere.

## Supabase DEV project
- Project: `flowdesk-dev`, ref `cnncbzywdhrsbtsgsqqd` (org "Muhammad Aqib's projects", free plan).
- The Supabase MCP connector has write access in this workspace; the user has
  chosen that Claude applies migrations through it. Still: every change is first
  written as a file in `supabase/migrations/` (source of truth), then applied with
  `apply_migration` using the same name, then verified with `get_advisors`.
- Migrations applied so far: `schema`, `logic`, `rls`, `harden_function_grants`;
  `seed.sql` applied once.
- Expected advisor findings (intentional): `employee_tasks_view` is SECURITY
  DEFINER; `is_admin`, `activate_project`, `update_my_task_status` are executable
  by `authenticated` (each checks its caller). `rls_auto_enable` is Supabase's own.

## Auth implementation (Phase 2)
- `lib/auth/get-current-profile.js` — `getCurrentProfile()` (React.cache): verifies JWT with `getClaims()`, loads `profiles` row.
- `lib/auth/guards.js` — `requireUser()` / `requireAdmin()` for layouts & pages (redirect). `homePathForRole()`.
- `lib/auth/action-guards.js` — `requireUserAction()` / `requireAdminAction()` for Server Actions (throw `AuthError`).
- `lib/action-state.js` — `{ ok, message, errors }` shape for `useActionState`; `fieldErrors(zodError)`, `formToObject()`.
- `lib/actions/auth.js` — `signIn`, `signOut`, `setPassword`. `lib/actions/team.js` — `inviteEmployee` (secret key, after admin check), `updateUserRole`, `setUserActive` (also bans/unbans at Auth level).
- Invite link flow: Supabase email → `/auth/confirm?token_hash=…&type=invite` (`verifyOtp`) → `/auth/set-password` → role home. The **Invite user email template** in Supabase must link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`, and `/auth/confirm` must be in Redirect URLs. `NEXT_PUBLIC_SITE_URL` (optional) overrides the request host for those links.
- Shell: `components/layout/{app-shell,sidebar,top-bar,user-menu,theme-toggle}.jsx`; nav config in `lib/navigation.js`; UI store `lib/stores/ui-store.js`.
- Shared pieces: `components/shared/{page-header,empty-state,page-skeleton,form-message,brand-mark,coming-soon}.jsx`.
- Design references: `docs/design/*.png` + `docs/design/README.md` (mockup "Orders" = our Projects; "Reports" page parked).

## Phases
0. ✅ Project setup
1. ✅ Database migrations + seed
2. ✅ Auth: login, role redirects, layouts, guards, invite flow (basic Team page)
3. Admin: Clients + Services (template editor)
4. Admin: Projects (create, activate, detail)
5. Admin: Tasks (board, list, drawer, subtasks, comments, activity)
6. Employee portal
7. Admin Dashboard, Global Monitor, Team
8. Settings, hardening, deploy checklist

Manual test checklists are delivered at the end of phases 2, 6 and 8.

## Definition of done
- An employee cannot open any `/admin` URL.
- As an employee, a direct Supabase query for another employee's tasks, for
  clients, or for projects returns zero rows.
- Completing a task updates `progress_percent` in the DB with no app code.
- Activating a project creates its template tasks exactly once.
- No secret key in client bundles or git history.
- Lists paginate, charts load lazily, main content fits one screen.

## Commands
```
npm run dev      # http://localhost:3000
npm run build    # must pass before each phase ends
npm run lint
```
