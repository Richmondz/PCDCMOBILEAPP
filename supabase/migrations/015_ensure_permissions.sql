
-- Ensure authenticated users can execute the critical security helper functions
grant execute on function public.is_chat_member(uuid) to authenticated;
grant execute on function public.is_chat_member(uuid) to service_role;

grant execute on function public.get_chat_members(uuid) to authenticated;
grant execute on function public.get_chat_members(uuid) to service_role;

grant execute on function public.create_dm(uuid) to authenticated;
grant execute on function public.create_dm(uuid) to service_role;

-- Ensure profiles are readable (re-affirming just in case)
-- Note: Policy "Profiles are viewable by everyone" should already exist from previous migrations.
