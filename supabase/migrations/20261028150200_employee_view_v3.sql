-- ============================================================================
-- FlowDesk · Migration 9: employee_tasks_view v3 — project task totals
-- ============================================================================
-- Appends project_task_total / project_task_done (counts over ALL tasks of
-- the project, so the portal can mirror recalc_project_progress() for an
-- optimistic progress bar). Counts only — no other employee's task details.
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
  (select count(*) from public.tasks x where x.project_id = p.id and x.status = 'completed')::integer as project_task_done
from public.tasks t
join public.projects p on p.id = t.project_id
join public.clients  c on c.id = p.client_id
join public.services s on s.id = p.service_id
where t.assignee_id = (select auth.uid());

revoke all on public.employee_tasks_view from public, anon;
grant select on public.employee_tasks_view to authenticated;
