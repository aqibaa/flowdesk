-- ============================================================================
-- FlowDesk · Migration 6: move_task(task_id, new_status, ordered_ids)
-- ============================================================================
-- One Kanban drop = one transaction: set the dragged task's status and
-- rewrite `position` for every task in the destination column from the
-- order the UI sends. SECURITY INVOKER, so the caller's RLS applies (admins
-- only in practice; employees have no UPDATE policy on tasks and use
-- update_my_task_status instead). Status/progress/activity triggers fire
-- as usual.
create or replace function public.move_task(
  p_task_id uuid,
  p_new_status public.task_status,
  p_ordered_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can move tasks.' using errcode = '42501';
  end if;

  if p_task_id <> all (p_ordered_ids) then
    raise exception 'ordered_ids must include the moved task.' using errcode = '22023';
  end if;

  update public.tasks
     set status = p_new_status
   where id = p_task_id;
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Task not found.' using errcode = 'P0002';
  end if;

  -- Positions follow array order; only tasks already in that status change.
  update public.tasks t
     set position = o.pos - 1
    from unnest(p_ordered_ids) with ordinality as o(id, pos)
   where t.id = o.id
     and t.status = p_new_status;
end;
$$;

revoke execute on function public.move_task(uuid, public.task_status, uuid[]) from public, anon;
grant  execute on function public.move_task(uuid, public.task_status, uuid[]) to authenticated;
