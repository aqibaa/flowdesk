-- ============================================================================
-- FlowDesk · Migration 8: my_task_comments_view
-- ============================================================================
-- Employees can read task_comments on their own tasks (RLS) but cannot read
-- other people's profiles, so an embedded author join returns null. This
-- SECURITY DEFINER view adds author_name while staying scoped to the
-- caller's own tasks. Admins use the tables directly.
create or replace view public.my_task_comments_view
with (security_invoker = false)
as
select
  tc.id,
  tc.task_id,
  tc.body,
  tc.created_at,
  tc.author_id,
  pr.full_name as author_name
from public.task_comments tc
join public.tasks t on t.id = tc.task_id
left join public.profiles pr on pr.id = tc.author_id
where t.assignee_id = (select auth.uid());

revoke all on public.my_task_comments_view from public, anon;
grant select on public.my_task_comments_view to authenticated;
