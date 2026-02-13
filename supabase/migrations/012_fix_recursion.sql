
-- Drop the recursive policy
drop policy if exists "Users can view members of their chats" on public.chat_members;

-- Create a simplified non-recursive policy
-- Users can see their OWN membership
create policy "Users can view own memberships"
  on public.chat_members for select
  using ( user_id = auth.uid() );

-- Users can see OTHER members IF they share a chat_id
-- We avoid recursion by using a security definer function or a slightly different join approach.
-- But standard RLS often struggles with "I can see row X if I have a row Y where X.chat_id = Y.chat_id"
-- because querying row Y checks the policy again.

-- Correct approach to avoid infinite recursion:
-- 1. Split visibility into two policies OR
-- 2. Use a "security definer" view/function (complex) OR
-- 3. Trust that if I can see the CHAT, I can see its MEMBERS.

-- Since "Users can view chats they are members of" exists on public.chats:
-- create policy "Users can view chats they are members of" on public.chats ...

-- We can rewrite the chat_members policy to rely on the CHATS table policy?
-- "I can see a chat_member row if I can see the corresponding CHAT row."
-- BUT "I can see the chat row" is defined by checking chat_members... CIRCULAR.

-- BREAK THE CYCLE:
-- Users can see a chat_member row if:
-- 1. It is their own row (user_id = auth.uid())
-- 2. OR there exists a row in chat_members for THIS chat_id where user_id = auth.uid()

-- Wait, #2 IS the recursion. 
-- "Select * from chat_members where chat_id = X" -> checks policy for each row.
-- Policy says: "exists (select 1 from chat_members where chat_id = X and user_id = me)"
-- The subquery triggers the policy again.

-- SOLUTION: Use a separate "security definer" function to check membership without triggering RLS.

create or replace function public.is_chat_member(c_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.chat_members
    where chat_id = c_id
    and user_id = auth.uid()
  );
$$;

create policy "Users can view members of their chats"
  on public.chat_members for select
  using (
    public.is_chat_member(chat_id)
  );

-- Also update CHATS policy to use this function to be safe/consistent
drop policy if exists "Users can view chats they are members of" on public.chats;
create policy "Users can view chats they are members of"
  on public.chats for select
  using (
    public.is_chat_member(id)
  );

-- Also update MESSAGES policy
drop policy if exists "Users can view messages in their chats" on public.chat_messages;
create policy "Users can view messages in their chats"
  on public.chat_messages for select
  using (
    public.is_chat_member(chat_id)
  );
