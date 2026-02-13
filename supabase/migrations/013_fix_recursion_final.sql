
-- 1. Helper function to check membership safely (SECURITY DEFINER)
create or replace function public.is_chat_member(c_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.chat_members
    where chat_id = c_id
    and user_id = auth.uid()
  );
$$;

-- 2. Update CHAT_MEMBERS policy to avoid recursion
drop policy if exists "Users can view members of their chats" on public.chat_members;
create policy "Users can view members of their chats"
  on public.chat_members for select
  using (
    public.is_chat_member(chat_id)
  );

-- 3. Update CHATS policy
drop policy if exists "Users can view chats they are members of" on public.chats;
create policy "Users can view chats they are members of"
  on public.chats for select
  using (
    public.is_chat_member(id)
  );

-- 4. Update MESSAGES policy
drop policy if exists "Users can view messages in their chats" on public.chat_messages;
create policy "Users can view messages in their chats"
  on public.chat_messages for select
  using (
    public.is_chat_member(chat_id)
  );
