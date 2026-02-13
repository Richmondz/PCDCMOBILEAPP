-- Enable RLS on profiles if not already
alter table public.profiles enable row level security;

-- Allow all authenticated users to view profiles (needed for search)
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

-- Ensure chat tables have RLS enabled
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;

-- Policies for CHATS
create policy "Users can view chats they are members of"
  on public.chats for select
  using (
    exists (
      select 1 from public.chat_members
      where chat_id = id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert chats"
  on public.chats for insert
  with check ( created_by = auth.uid() );

-- Policies for CHAT_MEMBERS
create policy "Users can view members of their chats"
  on public.chat_members for select
  using (
    exists (
      select 1 from public.chat_members as cm
      where cm.chat_id = chat_members.chat_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Users can insert themselves or others into chats"
  on public.chat_members for insert
  with check ( true ); -- logic usually handled by RPC or specific constraints, keeping open for now

-- Policies for CHAT_MESSAGES
create policy "Users can view messages in their chats"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_members
      where chat_id = chat_messages.chat_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their chats"
  on public.chat_messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.chat_members
      where chat_id = chat_messages.chat_id
      and user_id = auth.uid()
    )
  );

-- Redefine create_dm function to work with CHATS schema
create or replace function public.create_dm(target uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  existing_chat_id uuid;
  new_chat_id uuid;
begin
  -- 1. Check if DM already exists using dm_pairs table
  select chat_id into existing_chat_id
  from public.dm_pairs
  where (user_a = auth.uid() and user_b = target)
     or (user_a = target and user_b = auth.uid())
  limit 1;

  if existing_chat_id is not null then
    return existing_chat_id;
  end if;

  -- 2. Create new chat
  insert into public.chats (type, title, created_by)
  values ('dm', null, auth.uid())
  returning id into new_chat_id;

  -- 3. Add members
  -- Handle potential race condition where chat_members might be inserted concurrently
  begin
    insert into public.chat_members (chat_id, user_id, role)
    values 
      (new_chat_id, auth.uid(), 'admin'),
      (new_chat_id, target, 'member')
    on conflict (chat_id, user_id) do nothing;
  exception when unique_violation then
    -- If duplicate key occurs, ignore it (shouldn't happen with new_chat_id unless heavily concurrent)
  end;

  -- 4. Record in dm_pairs
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
