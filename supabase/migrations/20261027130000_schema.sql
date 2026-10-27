-- ============================================================================
-- FlowDesk · Migration 1: enums, tables, indexes, housekeeping triggers
-- ============================================================================
-- Everything lives in schema `public`. RLS is enabled on every table here;
-- the policies themselves are in migration 3 (..._rls.sql).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'employee');
create type public.project_status as enum ('pending', 'active', 'on_hold', 'completed', 'cancelled');
create type public.task_status as enum ('todo', 'in_progress', 'in_review', 'completed');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user. profiles.role is the ONLY role source.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text unique,
  role        public.app_role not null default 'employee',
  job_title   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
comment on table public.profiles is 'App user profile. role is the source of truth; never trust user_metadata.';

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  company_name  text not null,
  contact_name  text,
  email         text,
  phone         text,
  notes         text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- services + service_template_tasks (the template copied on activation)
-- ---------------------------------------------------------------------------
create table public.services (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.service_template_tasks (
  id               uuid primary key default gen_random_uuid(),
  service_id       uuid not null references public.services (id) on delete cascade,
  title            text not null,
  description      text,
  estimated_hours  numeric(8,2) check (estimated_hours is null or estimated_hours >= 0),
  position         integer not null default 0
);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients (id) on delete restrict,
  service_id        uuid not null references public.services (id) on delete restrict,
  name              text not null,
  status            public.project_status not null default 'pending',
  progress_percent  integer not null default 0 check (progress_percent between 0 and 100),
  lead_id           uuid references public.profiles (id) on delete set null,
  start_date        date,
  due_date          date,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint projects_dates_check check (due_date is null or start_date is null or due_date >= start_date)
);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id               uuid primary key default gen_random_uuid(),
  task_number      bigint generated always as identity unique,  -- shown as TSK-<n>
  project_id       uuid not null references public.projects (id) on delete cascade,
  title            text not null,
  description      text,
  status           public.task_status not null default 'todo',
  priority         public.task_priority not null default 'medium',
  assignee_id      uuid references public.profiles (id) on delete set null,
  reporter_id      uuid references public.profiles (id) on delete set null,
  due_date         date,
  estimated_hours  numeric(8,2) check (estimated_hours is null or estimated_hours >= 0),
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create table public.task_subtasks (
  id        uuid primary key default gen_random_uuid(),
  task_id   uuid not null references public.tasks (id) on delete cascade,
  title     text not null,
  is_done   boolean not null default false,
  position  integer not null default 0
);

create table public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  body        text not null check (length(btrim(body)) > 0),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- activity_log — written only by triggers (see migration 2)
-- ---------------------------------------------------------------------------
create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  project_id  uuid references public.projects (id) on delete cascade,
  task_id     uuid references public.tasks (id) on delete cascade,
  action      text not null,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index tasks_assignee_status_idx       on public.tasks (assignee_id, status);
create index tasks_project_status_idx        on public.tasks (project_id, status);
create index projects_client_idx             on public.projects (client_id);
create index projects_status_idx             on public.projects (status);
create index task_comments_task_idx          on public.task_comments (task_id);
create index activity_log_project_created_idx on public.activity_log (project_id, created_at desc);
-- Supporting indexes for FKs that RLS policies and joins hit often.
create index task_subtasks_task_idx          on public.task_subtasks (task_id);
create index service_template_tasks_service_idx on public.service_template_tasks (service_id, position);
create index projects_lead_idx               on public.projects (lead_id);
create index activity_log_task_idx           on public.activity_log (task_id);
create index tasks_due_date_idx              on public.tasks (due_date) where status <> 'completed';

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_set_updated_at  before update on public.clients
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at    before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile auto-creation on auth.users insert (default role: employee).
-- full_name comes from invite metadata if present; role is NEVER taken from
-- metadata — the admin sets it afterwards in the app.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync if the auth email changes.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- RLS on (policies in migration 3). Anon gets nothing: no policies = no rows.
-- ---------------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.clients                enable row level security;
alter table public.services               enable row level security;
alter table public.service_template_tasks enable row level security;
alter table public.projects               enable row level security;
alter table public.tasks                  enable row level security;
alter table public.task_subtasks          enable row level security;
alter table public.task_comments          enable row level security;
alter table public.activity_log           enable row level security;
