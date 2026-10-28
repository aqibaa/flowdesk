-- ============================================================================
-- FlowDesk · Migration 10: profiles.notification_prefs
-- ============================================================================
-- Per-user notification toggles for the Settings page. Stored as jsonb so
-- new event types need no schema change. Keys (all boolean, default true
-- when absent): task_assigned, task_completed, project_at_risk — each with
-- `email` and `in_app` channels, e.g. {"task_assigned":{"email":true,"in_app":true}}.
-- Users may update their own row (existing RLS policy), so no new policy.
alter table public.profiles
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb;

comment on column public.profiles.notification_prefs is
  'Notification toggles: {event: {email: bool, in_app: bool}}. Missing keys mean enabled.';
