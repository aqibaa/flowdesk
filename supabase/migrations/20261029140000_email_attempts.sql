-- Cap email retries. A row that fails 3 times (e.g. Resend test mode refusing
-- a recipient) is given up on: emailed_at is stamped, email_error keeps the
-- last reason. Without this every Server Action re-tried permanently failing
-- rows and spammed the server log.

alter table public.notifications
  add column if not exists email_attempts int not null default 0;
