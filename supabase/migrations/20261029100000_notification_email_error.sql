-- Review item 1: background email dispatch.
-- Keep the last send error on the row so a failed email is visible in the
-- database (previously only in server logs). Rows with an error keep
-- emailed_at NULL and are retried on the next dispatch for that project.

alter table public.notifications
  add column if not exists email_error text;

-- Dispatcher now works per project (one query for an activation's N tasks).
create index if not exists notifications_project_pending_email_idx
  on public.notifications (project_id)
  where emailed_at is null;
