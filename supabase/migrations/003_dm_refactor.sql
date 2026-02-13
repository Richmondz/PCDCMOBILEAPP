create or replace function public.create_dm(target uuid)
returns uuid language plpgsql security definer as $$
declare con_id uuid;
declare me uuid := auth.uid();
begin
  -- Check for blocks
  if exists (select 1 from public.blocks where (blocker_id = me and blocked_id = target) or (blocker_id = target and blocked_id = me)) then
    raise exception 'Cannot message this user';
  end if;

  -- Check existing 1:1 conversation
  select c.id into con_id
  from public.conversations c
  join public.conversation_members m1 on m1.conversation_id = c.id and m1.user_id = me
  join public.conversation_members m2 on m2.conversation_id = c.id and m2.user_id = target
  group by c.id
  having count(distinct c.id) = 1;

  if con_id is not null then
    return con_id;
  end if;

  -- Create new
  insert into public.conversations default values returning id into con_id;
  insert into public.conversation_members(conversation_id, user_id) values (con_id, me);
  insert into public.conversation_members(conversation_id, user_id) values (con_id, target);
  return con_id;
end $$;