-- Review item 2: dashboard / monitor aggregations in SQL instead of JS.
-- All objects are admin-only (security_invoker + is_admin() guard, so RLS on
-- the base tables still applies and employees always get zero rows).
-- Additive: no tables or columns change.

-- ---------------------------------------------------------------------------
-- 1. dashboard_kpis_view — one row: the four tiles on /admin.
-- ---------------------------------------------------------------------------
create or replace view public.dashboard_kpis_view
with (security_invoker = true)
as
select
  (select count(*) from public.clients)                                              as clients,
  (select count(*) from public.projects where status = 'active')                     as active_projects,
  (select count(*) from public.profiles where role = 'employee' and is_active)       as employees,
  coalesce((select round(avg(progress_percent)) from public.projects where status = 'active'), 0)::int
                                                                                     as overall_progress
where public.is_admin();

-- ---------------------------------------------------------------------------
-- 2. projects_by_service_view — active projects per service (donut).
-- ---------------------------------------------------------------------------
create or replace view public.projects_by_service_view
with (security_invoker = true)
as
select
  coalesce(s.id::text, 'none')          as id,
  coalesce(s.title, 'No service')       as name,
  count(p.id)::int                      as value
from public.projects p
left join public.services s on s.id = p.service_id
where p.status = 'active'
  and public.is_admin()
group by s.id, s.title;

-- ---------------------------------------------------------------------------
-- 3. completion_trend(p_weeks) — tasks completed per ISO week (Mon–Sun),
--    oldest first, zero-filled. Same buckets the JS version produced.
-- ---------------------------------------------------------------------------
create or replace function public.completion_trend(p_weeks int default 6)
returns table (week_start date, completed int)
language sql
stable
set search_path = public
as $$
  with weeks as (
    select (date_trunc('week', current_date) - make_interval(weeks => g))::date as week_start
    from generate_series(p_weeks - 1, 0, -1) as g
  )
  select w.week_start,
         count(t.id)::int as completed
  from weeks w
  left join public.tasks t
    on t.status = 'completed'
   and t.completed_at >= w.week_start
   and t.completed_at <  w.week_start + 7
  where public.is_admin()
  group by w.week_start
  order by w.week_start;
$$;

revoke all on function public.completion_trend(int) from public, anon;
grant execute on function public.completion_trend(int) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. at_risk_projects_view — scoring moved from lib/queries/dashboard.js.
--    Overdue → due ≤ 7 days → behind schedule by ≥ 25 points → on hold.
--    The app orders by score desc and limits to 5.
-- ---------------------------------------------------------------------------
create or replace view public.at_risk_projects_view
with (security_invoker = true)
as
with base as (
  select
    p.id, p.name, p.status, p.progress_percent, p.start_date, p.due_date,
    c.company_name   as client_name,
    s.title          as service_title,
    l.full_name      as lead_name,
    (p.due_date - current_date)::int as days_left,
    case when p.start_date is not null then
      least(100, greatest(0,
        round(100.0 * (current_date - p.start_date) / greatest(1, p.due_date - p.start_date))))::int
    end as elapsed_pct
  from public.projects p
  left join public.clients  c on c.id = p.client_id
  left join public.services s on s.id = p.service_id
  left join public.profiles l on l.id = p.lead_id
  where p.status in ('active', 'on_hold')
    and p.due_date is not null
    and public.is_admin()
),
scored as (
  select *,
    case
      when days_left < 0 and progress_percent < 100
        then 'Overdue by ' || (-days_left) || 'd'
      when days_left <= 7
        then case when days_left = 0 then 'Due today' else 'Due in ' || days_left || 'd' end
      when elapsed_pct is not null and elapsed_pct - progress_percent >= 25
        then 'Behind schedule (' || elapsed_pct || '% time, ' || progress_percent || '% done)'
      when status = 'on_hold'
        then 'On hold'
    end as reason,
    case
      when days_left < 0 and progress_percent < 100                       then 1000 - days_left
      when days_left <= 7                                                  then 500 - days_left * 10 + (100 - progress_percent)
      when elapsed_pct is not null and elapsed_pct - progress_percent >= 25 then 100 + (elapsed_pct - progress_percent)
      when status = 'on_hold'                                              then 50
      else 0
    end as score
  from base
)
select id, name, status, progress_percent, start_date, due_date,
       client_name, service_title, lead_name, days_left, reason, score
from scored
where reason is not null;

-- ---------------------------------------------------------------------------
-- 5. workload_heatmap_view — estimated hours of open, assigned tasks per
--    employee per due day. The app filters to the current Mon–Fri.
-- ---------------------------------------------------------------------------
create or replace view public.workload_heatmap_view
with (security_invoker = true)
as
select
  t.assignee_id,
  t.due_date,
  coalesce(sum(t.estimated_hours), 0)::numeric(8,2) as hours
from public.tasks t
where t.status <> 'completed'
  and t.assignee_id is not null
  and t.due_date is not null
  and public.is_admin()
group by t.assignee_id, t.due_date;

revoke all on public.dashboard_kpis_view, public.projects_by_service_view,
              public.at_risk_projects_view, public.workload_heatmap_view
  from public, anon;
grant select on public.dashboard_kpis_view, public.projects_by_service_view,
                public.at_risk_projects_view, public.workload_heatmap_view
  to authenticated;
