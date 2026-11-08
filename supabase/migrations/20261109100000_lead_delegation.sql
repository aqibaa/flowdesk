-- Feature: project leads can delegate their tasks.
-- An employee who is the `lead_id` of a project may reassign tasks of that
-- project to any active team member. Admins keep full control as before.
-- Employees still have NO direct UPDATE policy on tasks; everything goes
-- through the guarded RPC below.

-- ---------------------------------------------------------------------------
-- 1. team_directory_view — names only, so an employee can pick an assignee.
--    SECURITY DEFINER (like employee_tasks_view): profiles RLS would otherwise
--    hide colleagues. Exposes no email, prefs or anything else.
-- ---------------------------------------------------------------------------
create or replace view public.team_directory_view
with (security_invoker = false)
as
select id, full_name, job_title, role
from public.profiles
where is_active
  and (select auth.uid()) is not null;

revoke all on public.team_directory_view from public, anon;
grant select on public.team_directory_view to authenticated;

-- ---------------------------------------------------------------------------
-- 2. employee_tasks_view v4: + project_lead_id, assignee_name, so the portal
--    knows when the viewer leads the project (and can show who holds a task).
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
  c.company_name  as client_company_name,
  p.progress_percent as project_progress_percent,
  s.title         as service_title,
  (select count(*) from public.task_subtasks st where st.task_id = t.id)::integer as subtask_total,
  (select count(*) from public.task_subtasks st where st.task_id = t.id and st.is_done)::integer as subtask_done,
  (select count(*) from public.task_comments tc where tc.task_id = t.id)::integer as comment_count,
  (select count(*) from public.tasks x where x.project_id = p.id)::integer as project_task_total,
  (select count(*) from public.tasks x where x.project_id = p.id and x.status = 'completed')::integer as project_task_done,
  -- new in v4 (appended: Postgres only allows adding view columns at the end)
  p.lead_id       as project_lead_id,
  a.full_name     as assignee_name
from public.tasks t
join public.projects p on p.id = t.project_id
join public.clients  c on c.id = p.client_id
join public.services s on s.id = p.service_id
left join public.profiles a on a.id = t.assignee_id
where t.assignee_id = (select auth.uid());

revoke all on public.employee_tasks_view from public, anon;
grant select on public.employee_tasks_view to authenticated;

-- ---------------------------------------------------------------------------
-- 3. reassign_task(task, new assignee) — caller must be admin or the lead of
--    the task's project. Changes ONLY assignee_id; the existing triggers write
--    activity_log and the task_assigned notification (actor = caller).
-- ---------------------------------------------------------------------------
create or replace function public.reassign_task(p_task_id uuid, p_assignee_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_lead   uuid;
begin
  if v_caller is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select p.lead_id into v_lead
  from public.tasks t join public.projects p on p.id = t.project_id
  where t.id = p_task_id;
  if not found then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;

  if not public.is_admin() and v_lead is distinct from v_caller then
    raise exception 'Only the project lead can reassign this task' using errcode = '42501';
  end if;

  if p_assignee_id is not null and not exists (
    select 1 from public.profiles where id = p_assignee_id and is_active
  ) then
    raise exception 'Assignee is not an active team member' using errcode = '23503';
  end if;

  update public.tasks set assignee_id = p_assignee_id where id = p_task_id;
end;
$$;

revoke all on function public.reassign_task(uuid, uuid) from public, anon;
grant execute on function public.reassign_task(uuid, uuid) to authenticated;
