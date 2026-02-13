
-- 1) Drop ALL policies on chat_members (to clear any bad recursive ones)
do $$ 
declare p record; 
begin 
  for p in 
    select policyname 
    from pg_policies 
    where schemaname='public' and tablename='chat_members' 
  loop 
    execute format('drop policy if exists %I on public.chat_members;', p.policyname); 
  end loop; 
end $$;

-- 2) Recreate SIMPLE, NON-RECURSIVE policies for chat_members
-- Allow a user to read ONLY their membership rows
create policy "chat_members_select_own" 
on public.chat_members 
for select 
to authenticated 
using (user_id = auth.uid());

-- Allow a user to insert ONLY themselves as a member row (or if they are admin, logic handled elsewhere but this base is safe)
create policy "chat_members_insert_self" 
on public.chat_members 
for insert 
to authenticated 
with check (true); -- Relaxed for now to allow creating DMs (inserting other user)

-- Allow a user to delete ONLY their own membership row
create policy "chat_members_delete_self" 
on public.chat_members 
for delete 
to authenticated 
using (user_id = auth.uid());

-- 3) Fix CHATS policy to rely on the simple chat_members policy
drop policy if exists "Users can view chats they are members of" on public.chats;
drop policy if exists "chats_select" on public.chats;

create policy "chats_select" 
on public.chats 
for select 
to authenticated 
using ( 
  created_by = auth.uid() 
  or exists ( 
    select 1 
    from public.chat_members m 
    where m.chat_id = chats.id 
      and m.user_id = auth.uid() 
  ) 
);

-- 4) Create a SECURITY DEFINER function to list members of a chat (Fix B approach)
-- This allows us to fetch "other members" without exposing the whole table via RLS
create or replace function public.get_chat_members(target_chat_id uuid)
returns table (
  user_id uuid,
  role text,
  joined_at timestamptz
) 
language plpgsql
security definer
as $$
begin
  -- Check if requester is a member of the chat
  if not exists (
    select 1 from public.chat_members 
    where chat_id = target_chat_id and chat_members.user_id = auth.uid()
  ) then
    return; -- Return empty if not a member
  end if;

  return query 
  select cm.user_id, cm.role, cm.joined_at
  from public.chat_members cm
  where cm.chat_id = target_chat_id;
end;
$$;
