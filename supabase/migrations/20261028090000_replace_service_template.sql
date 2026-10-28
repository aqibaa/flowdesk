-- ============================================================================
-- FlowDesk · Migration 5: replace_service_template(service_id, tasks jsonb)
-- ============================================================================
-- Saves the template editor in ONE transaction: rows missing from the payload
-- are deleted, rows with an id are updated, rows without an id are inserted,
-- and position is rewritten from array order. Admin only (RLS also applies:
-- the function is SECURITY INVOKER, so the caller's policies are enforced).
--
-- p_tasks: [{ "id": uuid|null, "title": text, "description": text|null,
--             "estimated_hours": numeric|null }, ...]
create or replace function public.replace_service_template(p_service_id uuid, p_tasks jsonb)
returns setof public.service_template_tasks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_keep uuid[];
begin
  if not public.is_admin() then
    raise exception 'Only admins can edit templates.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.services where id = p_service_id) then
    raise exception 'Service not found.' using errcode = 'P0002';
  end if;

  if jsonb_typeof(p_tasks) <> 'array' then
    raise exception 'p_tasks must be a JSON array.' using errcode = '22023';
  end if;

  -- Update existing rows (those carrying an id) and remember which to keep.
  with incoming as (
    select nullif(elem ->> 'id', '')::uuid       as id,
           elem ->> 'title'                      as title,
           nullif(elem ->> 'description', '')    as description,
           nullif(elem ->> 'estimated_hours', '')::numeric as estimated_hours,
           (ord - 1)::integer                    as position
      from jsonb_array_elements(p_tasks) with ordinality as a(elem, ord)
  ),
  updated as (
    update public.service_template_tasks t
       set title = i.title,
           description = i.description,
           estimated_hours = i.estimated_hours,
           position = i.position
      from incoming i
     where i.id is not null
       and t.id = i.id
       and t.service_id = p_service_id
    returning t.id
  ),
  inserted as (
    insert into public.service_template_tasks (service_id, title, description, estimated_hours, position)
    select p_service_id, i.title, i.description, i.estimated_hours, i.position
      from incoming i
     where i.id is null
    returning id
  )
  select array_agg(id) into v_keep
    from (select id from updated union all select id from inserted) k;

  -- Remove rows the editor dropped.
  delete from public.service_template_tasks
   where service_id = p_service_id
     and (v_keep is null or id <> all (v_keep));

  return query
    select * from public.service_template_tasks
     where service_id = p_service_id
     order by position;
end;
$$;

revoke execute on function public.replace_service_template(uuid, jsonb) from public, anon;
grant  execute on function public.replace_service_template(uuid, jsonb) to authenticated;
