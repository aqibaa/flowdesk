-- Feature: due-date reminders (daily, pg_cron).
-- Runs at 03:00 UTC (08:00 PKT), right before the notification purge:
--   task_due_soon   → assignee, for open tasks due tomorrow (once per due date)
--   task_overdue    → assignee, for open tasks past due (once per due date,
--                     so moving the due date later re-arms the reminder)
--   overdue_digest  → every active admin, one row per day with the totals
-- All rows go through notify_user(), so Settings toggles and is_active apply,
-- and they reach the bell / toast / email exactly like trigger notifications.
-- Emails for these rows are sent by the Vercel cron route /api/cron/emails.

create or replace function public.send_due_reminders()
returns table (due_soon int, overdue int, digests int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_due_soon int := 0;
  v_overdue  int := 0;
  v_digests  int := 0;
  t record;
  a record;
  v_overdue_tasks int;
  v_overdue_projects int;
begin
  -- 1. Due tomorrow
  for t in
    select id, task_number, title, assignee_id, project_id, due_date
    from public.tasks
    where status <> 'completed'
      and assignee_id is not null
      and due_date = current_date + 1
      and not exists (
        select 1 from public.notifications n
        where n.task_id = tasks.id and n.user_id = tasks.assignee_id
          and n.type = 'task_due_soon'
          and n.created_at::date >= tasks.due_date - 1
      )
  loop
    perform public.notify_user(
      t.assignee_id, null, 'task_due_soon',
      'TSK-' || t.task_number || ' is due tomorrow',
      t.title, t.id, t.project_id);
    v_due_soon := v_due_soon + 1;
  end loop;

  -- 2. Overdue (first business morning after the due date passed)
  for t in
    select id, task_number, title, assignee_id, project_id, due_date
    from public.tasks
    where status <> 'completed'
      and assignee_id is not null
      and due_date < current_date
      and not exists (
        select 1 from public.notifications n
        where n.task_id = tasks.id and n.user_id = tasks.assignee_id
          and n.type = 'task_overdue'
          and n.created_at::date > tasks.due_date
      )
  loop
    perform public.notify_user(
      t.assignee_id, null, 'task_overdue',
      'TSK-' || t.task_number || ' is overdue',
      t.title || ' · was due ' || to_char(t.due_date, 'DD Mon'),
      t.id, t.project_id);
    v_overdue := v_overdue + 1;
  end loop;

  -- 3. Admin digest: one per admin per day, only when something is overdue
  select count(*), count(distinct project_id)
    into v_overdue_tasks, v_overdue_projects
  from public.tasks
  where status <> 'completed' and due_date < current_date;

  if v_overdue_tasks > 0 then
    for a in
      select id from public.profiles
      where role = 'admin' and is_active
        and not exists (
          select 1 from public.notifications n
          where n.user_id = profiles.id and n.type = 'overdue_digest'
            and n.created_at::date = current_date
        )
    loop
      perform public.notify_user(
        a.id, null, 'overdue_digest',
        v_overdue_tasks || ' overdue task' || case when v_overdue_tasks = 1 then '' else 's' end
          || ' across ' || v_overdue_projects || ' project' || case when v_overdue_projects = 1 then '' else 's' end,
        'Open the dashboard to see which projects are at risk.',
        null, null);
      v_digests := v_digests + 1;
    end loop;
  end if;

  return query select v_due_soon, v_overdue, v_digests;
end;
$$;

-- Scheduler only; never exposed through the API.
revoke all on function public.send_due_reminders() from public, anon, authenticated;

-- Index for the dedupe lookups above.
create index if not exists notifications_task_user_type_idx
  on public.notifications (task_id, user_id, type);

select cron.unschedule(jobid) from cron.job where jobname = 'send_due_reminders';
select cron.schedule('send_due_reminders', '0 3 * * *', 'select public.send_due_reminders()');
