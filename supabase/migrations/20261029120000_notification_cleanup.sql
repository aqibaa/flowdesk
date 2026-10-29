-- Review item 3: keep `notifications` small.
-- Nightly job (pg_cron) deletes read notifications older than 30 days and
-- unread ones older than 90 days. activity_log is untouched (audit history).
-- Task/project deletes already cascade to notifications (migration 11).

create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.purge_old_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.notifications
  where (is_read and created_at < now() - interval '30 days')
     or (not is_read and created_at < now() - interval '90 days');
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Only the scheduler (postgres) may run it; never exposed through the API.
revoke all on function public.purge_old_notifications() from public, anon, authenticated;

-- 03:00 UTC daily. Idempotent: re-running the migration replaces the job.
select cron.unschedule(jobid) from cron.job where jobname = 'purge_old_notifications';
select cron.schedule('purge_old_notifications', '0 3 * * *', 'select public.purge_old_notifications()');
