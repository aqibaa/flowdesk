-- Phase 9b: live toasts.
-- Publish `notifications` on the Realtime channel so the browser can receive
-- INSERTs as they happen (push, not polling). RLS still applies to Realtime:
-- a client only receives rows its policies allow it to SELECT, i.e. its own.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
