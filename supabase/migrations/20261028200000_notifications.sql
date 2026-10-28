-- ============================================================================
-- FlowDesk · Migration 11: notifications + activation assigns the lead
-- ============================================================================

-- ---------------------------------------------------------------------------
-- A. activate_project(): template tasks now default to the project lead.
--    Same behaviour otherwise (admin only, pending → active, one transaction).
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

  select * into v_project from public.projects where id = p_project_id for update;

  if not found then
    raise exception 'Project not found.' using errcode = 'P0002';
  end if;

  if v_project.status <> 'pending' then
    raise exception 'Project is already % and cannot be activated again.', v_project.status
      using errcode = 'P0001';
  end if;

  insert into public.tasks (project_id, title, description, estimated_hours, position, reporter_id, assignee_id)
  select v_project.id, t.title, t.description, t.estimated_hours, t.position, (select auth.uid()), v_project.lead_id
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

-- ---------------------------------------------------------------------------
-- B. notifications table
-- ---------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,
  type        text not null,               -- task_assigned | task_status_changed | task_commented
  title       text not null,
  body        text,
  task_id     uuid references public.tasks (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete cascade,
  is_read     boolean not null default false,
  emailed_at  timestamptz,                 -- set by the app once an email went out
  created_at  timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id, is_read, created_at desc);
create index notifications_task_pending_email_idx on public.notifications (task_id) where emailed_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon;

-- Users read their own; may only flip is_read on their own rows.
create policy "notifications: read own"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications: mark own read"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
-- No INSERT/DELETE policies: rows are written by triggers only.

-- ---------------------------------------------------------------------------
-- C. helper: does this user want in-app notifications of this type?
--    Missing key = enabled. Inactive users never get notifications.
-- ---------------------------------------------------------------------------
create or replace function public.notify_user(
  p_user_id uuid, p_actor_id uuid, p_type text, p_title text, p_body text,
  p_task_id uuid, p_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefs jsonb;
  v_active boolean;
begin
  if p_user_id is null or p_user_id = p_actor_id then
    return; -- never notify yourself
  end if;

  select notification_prefs, is_active into v_prefs, v_active
    from public.profiles where id = p_user_id;

  if not coalesce(v_active, false) then
    return;
  end if;
  if coalesce((v_prefs -> p_type ->> 'in_app')::boolean, true) = false
     and coalesce((v_prefs -> p_type ->> 'email')::boolean, true) = false then
    return; -- opted out of both channels
  end if;

  insert into public.notifications (user_id, actor_id, type, title, body, task_id, project_id)
  values (p_user_id, p_actor_id, p_type, p_title, p_body, p_task_id, p_project_id);
end;
$$;

revoke execute on function public.notify_user(uuid, uuid, text, text, text, uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- D. triggers on tasks (assignment + status) and task_comments
-- ---------------------------------------------------------------------------
create or replace function public.notify_task_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_key   text := 'TSK-' || new.task_number;
  v_admin record;
begin
  -- Assignment (insert with assignee, or assignee changed)
  if (tg_op = 'INSERT' and new.assignee_id is not null)
     or (tg_op = 'UPDATE' and new.assignee_id is distinct from old.assignee_id and new.assignee_id is not null) then
    perform public.notify_user(
      new.assignee_id, v_actor, 'task_assigned',
      v_key || ' assigned to you',
      new.title, new.id, new.project_id);
  end if;

  -- Status change: tell the assignee (if someone else changed it) and every
  -- active admin (except the actor).
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    perform public.notify_user(
      new.assignee_id, v_actor, 'task_status_changed',
      v_key || ' moved to ' || replace(new.status::text, '_', ' '),
      new.title, new.id, new.project_id);

    for v_admin in
      select id from public.profiles where role = 'admin' and is_active and id is distinct from new.assignee_id
    loop
      perform public.notify_user(
        v_admin.id, v_actor, 'task_status_changed',
        v_key || ' moved to ' || replace(new.status::text, '_', ' '),
        new.title, new.id, new.project_id);
    end loop;
  end if;

  return new;
end;
$$;

create trigger tasks_notify
  after insert or update of assignee_id, status on public.tasks
  for each row execute function public.notify_task_changes();

create or replace function public.notify_task_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task  public.tasks%rowtype;
  v_key   text;
  v_admin record;
begin
  select * into v_task from public.tasks where id = new.task_id;
  v_key := 'TSK-' || v_task.task_number;

  -- Assignee hears about comments from others.
  perform public.notify_user(
    v_task.assignee_id, new.author_id, 'task_commented',
    'New comment on ' || v_key,
    left(new.body, 140), v_task.id, v_task.project_id);

  -- Admins hear about comments from employees.
  if not exists (select 1 from public.profiles where id = new.author_id and role = 'admin') then
    for v_admin in select id from public.profiles where role = 'admin' and is_active loop
      perform public.notify_user(
        v_admin.id, new.author_id, 'task_commented',
        'New comment on ' || v_key,
        left(new.body, 140), v_task.id, v_task.project_id);
    end loop;
  end if;

  return new;
end;
$$;

create trigger task_comments_notify
  after insert on public.task_comments
  for each row execute function public.notify_task_comment();

revoke execute on function public.notify_task_changes() from public, anon, authenticated;
revoke execute on function public.notify_task_comment() from public, anon, authenticated;
