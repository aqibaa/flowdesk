-- Email delivery was removed from the app (no SMTP). Notifications now have
-- one channel (in-app: bell + live toast), so notify_user() skips an event
-- when its `in_app` toggle is off. The legacy `email` key in
-- profiles.notification_prefs is ignored; emailed_at / email_error stay
-- (unused, harmless).

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
  if coalesce((v_prefs -> p_type ->> 'in_app')::boolean, true) = false then
    return; -- opted out of this event
  end if;

  insert into public.notifications (user_id, actor_id, type, title, body, task_id, project_id)
  values (p_user_id, p_actor_id, p_type, p_title, p_body, p_task_id, p_project_id);
end;
$$;

revoke execute on function public.notify_user(uuid, uuid, text, text, text, uuid, uuid) from public, anon, authenticated;
