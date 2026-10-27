-- ============================================================================
-- FlowDesk · Migration 2: functions, triggers, RPCs, views
-- ============================================================================
-- All business rules that must hold regardless of app code live here.
-- Every function uses `set search_path = ''` and fully-qualified names, which
-- is the Supabase-recommended hardening for security definer functions.

-- ---------------------------------------------------------------------------
-- is_admin(): reads profiles.role for the calling user. Security definer so
-- it works inside RLS policies without a recursive profiles read.
-- A deactivated admin is not an admin.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'admin' and p.is_active
       from public.profiles p
      where p.id = (select auth.uid())),
    false
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Profiles: nobody may change their own role, and only admins may change
-- anyone's role. (Policies can't compare OLD/NEW, so this is a trigger.)
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if new.role is distinct from old.role then
    -- No JWT (SQL editor, migrations, service-role key) is trusted: this is
    -- how the first admin is promoted and how the invite flow sets roles.
    if v_uid is null then
      return new;
    end if;
    if v_uid = old.id then
      raise exception 'You cannot change your own role.' using errcode = '42501';
    end if;
    if not public.is_admin() then
      raise exception 'Only admins can change roles.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update of role on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- 1. Project progress = round(100 * completed / total), 0 when no tasks.
--    100% + active -> completed ; < 100% + completed -> active.
--    Security definer so the projects row updates even when the caller
--    (an employee going through update_my_task_status) has no projects policy.
-- ---------------------------------------------------------------------------
create or replace function public.recalc_project_progress(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total     integer;
  v_completed integer;
  v_percent   integer;
begin
  select count(*), count(*) filter (where t.status = 'completed')
    into v_total, v_completed
    from public.tasks t
   where t.project_id = p_project_id;

  v_percent := case when v_total = 0 then 0
                    else round(100.0 * v_completed / v_total)::integer end;

  update public.projects p
     set progress_percent = v_percent,
         status = case
                    when v_percent = 100 and p.status = 'active'    then 'completed'::public.project_status
                    when v_percent < 100  and p.status = 'completed' then 'active'::public.project_status
                    else p.status
                  end
   where p.id = p_project_id
     and (p.progress_percent is distinct from v_percent
          or (v_percent = 100 and p.status = 'active')
          or (v_percent < 100  and p.status = 'completed'));
end;
$$;

revoke execute on function public.recalc_project_progress(uuid) from public, anon, authenticated;

-- Trigger wrapper: handles INSERT / UPDATE OF status / DELETE, and a task
-- moving between projects (both projects recalculated).
create or replace function public.tasks_recalc_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_project_progress(old.project_id);
    return old;
  end if;

  perform public.recalc_project_progress(new.project_id);

  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    perform public.recalc_project_progress(old.project_id);
  end if;

  return new;
end;
$$;

create trigger tasks_recalc_progress
  after insert or delete or update of status, project_id on public.tasks
  for each row execute function public.tasks_recalc_progress();

-- ---------------------------------------------------------------------------
-- 2. completed_at: set when status becomes 'completed', cleared otherwise.
-- ---------------------------------------------------------------------------
create or replace function public.tasks_set_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'completed' then
    if tg_op = 'INSERT' or old.status is distinct from 'completed' then
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_set_completed_at
  before insert or update of status on public.tasks
  for each row execute function public.tasks_set_completed_at();

-- ---------------------------------------------------------------------------
-- 5. activity_log is written ONLY by these triggers (security definer because
--    no role has an INSERT policy on activity_log).
-- ---------------------------------------------------------------------------
create or replace function public.log_task_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    insert into public.activity_log (actor_id, project_id, task_id, action, meta)
    values (v_actor, new.project_id, new.id, 'task.created',
            jsonb_build_object('title', new.title, 'task_number', new.task_number));
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.activity_log (actor_id, project_id, task_id, action, meta)
    values (v_actor, new.project_id, new.id, 'task.status_changed',
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    insert into public.activity_log (actor_id, project_id, task_id, action, meta)
    values (v_actor, new.project_id, new.id, 'task.assigned',
            jsonb_build_object('from', old.assignee_id, 'to', new.assignee_id));
  end if;

  return new;
end;
$$;

create trigger tasks_log_activity
  after insert or update of status, assignee_id on public.tasks
  for each row execute function public.log_task_activity();

create or replace function public.log_project_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.activity_log (actor_id, project_id, action, meta)
    values ((select auth.uid()), new.id, 'project.status_changed',
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

create trigger projects_log_activity
  after update of status on public.projects
  for each row execute function public.log_project_activity();

-- ---------------------------------------------------------------------------
-- 3. activate_project(project_id): admin only, single transaction.
--    pending -> active and copies the service template tasks exactly once.
--    Returns the number of tasks created.
-- ---------------------------------------------------------------------------
create or replace function public.activate_project(p_project_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project   public.projects%rowtype;
  v_inserted  integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can activate projects.' using errcode = '42501';
  end if;

  -- Row lock prevents a double-click from activating twice.
  select * into v_project from public.projects where id = p_project_id for update;

  if not found then
    raise exception 'Project not found.' using errcode = 'P0002';
  end if;

  if v_project.status <> 'pending' then
    raise exception 'Project is already % and cannot be activated again.', v_project.status
      using errcode = 'P0001';
  end if;

  insert into public.tasks (project_id, title, description, estimated_hours, position, reporter_id)
  select v_project.id, t.title, t.description, t.estimated_hours, t.position, (select auth.uid())
    from public.service_template_tasks t
   where t.service_id = v_project.service_id
   order by t.position, t.title;

  get diagnostics v_inserted = row_count;

  update public.projects
     set status = 'active',
         start_date = coalesce(start_date, current_date)
   where id = p_project_id;

  return v_inserted;
end;
$$;

revoke execute on function public.activate_project(uuid) from public, anon;
grant  execute on function public.activate_project(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. update_my_task_status(task_id, new_status): the ONLY way an employee can
--    touch a task. Allowed solely when the task is assigned to the caller;
--    updates status and nothing else. Progress/completed_at/activity follow
--    automatically via the triggers above.
-- ---------------------------------------------------------------------------
create or replace function public.update_my_task_status(p_task_id uuid, p_new_status public.task_status)
returns public.task_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Not authenticated.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = v_uid and is_active) then
    raise exception 'Your account is inactive.' using errcode = '42501';
  end if;

  update public.tasks
     set status = p_new_status
   where id = p_task_id
     and assignee_id = v_uid;

  if not found then
    raise exception 'Task not found or not assigned to you.' using errcode = '42501';
  end if;

  return p_new_status;
end;
$$;

revoke execute on function public.update_my_task_status(uuid, public.task_status) from public, anon;
grant  execute on function public.update_my_task_status(uuid, public.task_status) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. employee_tasks_view: an employee's own tasks + project name + client
--    company name ONLY. Runs as the view owner (bypasses RLS), so the
--    assignee filter inside the view is the security boundary.
-- ---------------------------------------------------------------------------
create or replace view public.employee_tasks_view
with (security_invoker = false)
as
select
  t.id,
  t.task_number,
  t.project_id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.assignee_id,
  t.due_date,
  t.estimated_hours,
  t.position,
  t.created_at,
  t.updated_at,
  t.completed_at,
  p.name          as project_name,
  p.status        as project_status,
  p.due_date      as project_due_date,
  c.id            as client_id,
  c.company_name  as client_company_name
from public.tasks t
join public.projects p on p.id = t.project_id
join public.clients  c on c.id = p.client_id
where t.assignee_id = (select auth.uid());

revoke all on public.employee_tasks_view from public, anon;
grant select on public.employee_tasks_view to authenticated;

-- ---------------------------------------------------------------------------
-- 7. employee_workload_view (admin only): per active employee, open task
--    count and estimated hours of open tasks due this week (Mon–Sun).
--    workload_percent: 40 h = 100 %.
--    security_invoker = true so RLS on profiles/tasks still applies, plus an
--    explicit is_admin() guard -> employees always get zero rows.
-- ---------------------------------------------------------------------------
create or replace view public.employee_workload_view
with (security_invoker = true)
as
with week as (
  select date_trunc('week', current_date)::date as start_date,
         (date_trunc('week', current_date) + interval '6 days')::date as end_date
)
select
  pr.id,
  pr.full_name,
  pr.email,
  pr.job_title,
  pr.is_active,
  count(t.id) filter (where t.status <> 'completed')                         as open_task_count,
  count(t.id) filter (where t.status <> 'completed' and t.due_date < current_date) as overdue_task_count,
  coalesce(sum(t.estimated_hours) filter (
    where t.status <> 'completed'
      and t.due_date between week.start_date and week.end_date), 0)::numeric(8,2) as hours_due_this_week,
  least(100, round(100 * coalesce(sum(t.estimated_hours) filter (
    where t.status <> 'completed'
      and t.due_date between week.start_date and week.end_date), 0) / 40))::integer as workload_percent
from public.profiles pr
cross join week
left join public.tasks t on t.assignee_id = pr.id
where pr.role = 'employee'
  and public.is_admin()
group by pr.id, pr.full_name, pr.email, pr.job_title, pr.is_active;

revoke all on public.employee_workload_view from public, anon;
grant select on public.employee_workload_view to authenticated;
