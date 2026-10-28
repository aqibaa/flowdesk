-- ============================================================================
-- FlowDesk · Migration 7: employee_tasks_view v2
-- ============================================================================
-- Appends columns the employee portal needs (CREATE OR REPLACE VIEW may only
-- append, so existing columns keep their order):
--   project_progress_percent  – for the animated progress bar per project
--   service_title             – grouping label (service name is not client data)
--   subtask_total/subtask_done/comment_count – row badges without extra queries
-- Still SECURITY DEFINER and still filtered by assignee_id = auth.uid();
-- client email/phone/notes are never exposed.
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
  (select count(*) from public.task_comments tc where tc.task_id = t.id)::integer as comment_count
from public.tasks t
join public.projects p on p.id = t.project_id
join public.clients  c on c.id = p.client_id
join public.services s on s.id = p.service_id
where t.assignee_id = (select auth.uid());

revoke all on public.employee_tasks_view from public, anon;
grant select on public.employee_tasks_view to authenticated;
