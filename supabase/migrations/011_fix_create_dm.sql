
-- 1. Drop the existing function first to allow clean replacement
drop function if exists public.create_dm(uuid);

-- 2. Redefine the function with robust error handling
create or replace function public.create_dm(target uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  existing_chat_id uuid;
  new_chat_id uuid;
begin
  -- Check if DM already exists using dm_pairs table
  select chat_id into existing_chat_id
  from public.dm_pairs
  where (user_a = auth.uid() and user_b = target)
     or (user_a = target and user_b = auth.uid())
  limit 1;

  if existing_chat_id is not null then
    return existing_chat_id;
  end if;

  -- Create new chat
  insert into public.chats (type, title, created_by)
  values ('dm', null, auth.uid())
  returning id into new_chat_id;

  -- Add members (handle potential race conditions or duplicates gracefully)
  begin
    insert into public.chat_members (chat_id, user_id, role)
    values 
      (new_chat_id, auth.uid(), 'admin'),
      (new_chat_id, target, 'member')
    on conflict (chat_id, user_id) do nothing;
  exception when unique_violation then
    -- Ignore
  end;

  -- Record in dm_pairs
  begin
    insert into public.dm_pairs (user_a, user_b, chat_id)
    values (auth.uid(), target, new_chat_id);
  exception when unique_violation then
    -- If dm_pair was inserted concurrently, return that chat_id
    select chat_id into existing_chat_id
    from public.dm_pairs
    where (user_a = auth.uid() and user_b = target)
       or (user_a = target and user_b = auth.uid())
    limit 1;
    
    if existing_chat_id is not null then
      return existing_chat_id;
    end if;
  end;

  return new_chat_id;
end;
$$;
