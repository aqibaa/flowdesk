-- ============================================================================
-- FlowDesk · Migration 3: Row Level Security policies + grants
-- ============================================================================
-- RLS was enabled on every table in migration 1. With no policy a table
-- returns zero rows, so `anon` (no policies anywhere) can never read or write.
-- All policies are scoped `to authenticated`; `(select auth.uid())` is used
-- instead of bare auth.uid() so Postgres evaluates it once per query.
--
-- Matrix
--   profiles                 : own row read/update; admin read/update all; role change guarded by trigger
--   clients / services /
--   service_template_tasks /
--   projects                 : admin full; employees nothing
--   tasks                    : admin full; employee SELECT own; no employee writes (RPC only)
--   task_subtasks            : admin full; employee SELECT on own tasks
--   task_comments            : admin full; employee SELECT + INSERT on own tasks
--   activity_log             : admin SELECT; no direct writes for anyone (triggers only)

-- Defense in depth: anon should hold no table privileges at all.
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles: read own or admin reads all"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles: update own or admin updates all"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());
-- No INSERT policy: rows are created by the auth.users trigger (security definer).
-- No DELETE policy: deleting the auth user cascades; deactivate instead.

-- ---------------------------------------------------------------------------
-- clients — admin only
-- ---------------------------------------------------------------------------
create policy "clients: admin full access"
  on public.clients for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- services — admin only
-- ---------------------------------------------------------------------------
create policy "services: admin full access"
  on public.services for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "service_template_tasks: admin full access"
  on public.service_template_tasks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- projects — admin only (employees see project names via employee_tasks_view)
-- ---------------------------------------------------------------------------
create policy "projects: admin full access"
  on public.projects for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- tasks — admin full; employee read own assignments only
-- ---------------------------------------------------------------------------
create policy "tasks: admin full access"
  on public.tasks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "tasks: employee reads own"
  on public.tasks for select
  to authenticated
  using (assignee_id = (select auth.uid()));
-- Intentionally no employee INSERT/UPDATE/DELETE: status changes go through
-- update_my_task_status() (security definer, assignee check inside).

-- ---------------------------------------------------------------------------
-- task_subtasks — admin full; employee read on own tasks
-- ---------------------------------------------------------------------------
create policy "task_subtasks: admin full access"
  on public.task_subtasks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "task_subtasks: employee reads own tasks"
  on public.task_subtasks for select
  to authenticated
  using (exists (
    select 1 from public.tasks t
     where t.id = task_subtasks.task_id
       and t.assignee_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- task_comments — admin full; employee read + insert on own tasks
-- ---------------------------------------------------------------------------
create policy "task_comments: admin full access"
  on public.task_comments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "task_comments: employee reads own tasks"
  on public.task_comments for select
  to authenticated
  using (exists (
    select 1 from public.tasks t
     where t.id = task_comments.task_id
       and t.assignee_id = (select auth.uid())
  ));

create policy "task_comments: employee comments on own tasks"
  on public.task_comments for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.tasks t
       where t.id = task_comments.task_id
         and t.assignee_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- activity_log — admin read only; written by triggers (security definer)
-- ---------------------------------------------------------------------------
create policy "activity_log: admin reads"
  on public.activity_log for select
  to authenticated
  using (public.is_admin());
