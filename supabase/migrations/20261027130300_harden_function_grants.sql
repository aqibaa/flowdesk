-- ============================================================================
-- FlowDesk · Migration 4: harden function grants
-- ============================================================================
-- Trigger functions are only ever invoked by Postgres itself, but Supabase
-- exposes every function in `public` through /rest/v1/rpc. Revoke EXECUTE so
-- the security advisor is clean and nobody can poke them over the API.
-- (Calling a trigger function directly errors anyway; this is belt-and-braces.)
revoke execute on function public.set_updated_at()            from public, anon, authenticated;
revoke execute on function public.handle_new_user()           from public, anon, authenticated;
revoke execute on function public.handle_user_email_change()  from public, anon, authenticated;
revoke execute on function public.protect_profile_role()      from public, anon, authenticated;
revoke execute on function public.tasks_recalc_progress()     from public, anon, authenticated;
revoke execute on function public.tasks_set_completed_at()    from public, anon, authenticated;
revoke execute on function public.log_task_activity()         from public, anon, authenticated;
revoke execute on function public.log_project_activity()      from public, anon, authenticated;

-- Intentionally still executable by `authenticated` (each checks its caller):
--   is_admin(), activate_project(uuid), update_my_task_status(uuid, task_status)
-- Intentionally SECURITY DEFINER view (advisor "security_definer_view"):
--   employee_tasks_view — filtered by assignee_id = auth.uid() inside the view;
--   employees have no projects/clients policy, so a security-invoker view
--   could not join to project name / client company name at all.
