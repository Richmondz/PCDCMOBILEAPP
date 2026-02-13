
-- 1. Modify channels table structure
do $$ 
begin
  -- Add type if missing
  if not exists (select 1 from information_schema.columns where table_name='channels' and column_name='type') then
    alter table public.channels add column type text default 'chat';
  end if;
  
  -- Add slug if missing
  if not exists (select 1 from information_schema.columns where table_name='channels' and column_name='slug') then
    alter table public.channels add column slug text;
  end if;
end $$;

-- 2. Backfill Channels for EXISTING Cohorts
-- Ensure every cohort has a 'general' chat and 'community' posts channel
do $$
declare 
  c record;
begin
  for c in select id from public.cohorts loop
    -- Create General Chat if not exists
    insert into public.channels (cohort_id, name, type, slug)
    select c.id, 'General Chat', 'chat', 'general'
    where not exists (
      select 1 from public.channels 
      where cohort_id = c.id and (slug = 'general' or (name = 'General Chat' and type = 'chat'))
    );

    -- Create Community Board if not exists
    insert into public.channels (cohort_id, name, type, slug)
    select c.id, 'Community Board', 'posts', 'community'
    where not exists (
      select 1 from public.channels 
      where cohort_id = c.id and (slug = 'community' or (name = 'Community Board' and type = 'posts'))
    );
  end loop;
end $$;

-- 3. Create table for channel MESSAGES (General Chat)
create table if not exists public.channel_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  is_hidden boolean default false
);

-- 4. RLS Policies

-- Channels
alter table public.channels enable row level security;
drop policy if exists "Channels viewable by all" on public.channels;
create policy "Channels viewable by all" on public.channels for select using (true);

-- Channel MESSAGES
alter table public.channel_messages enable row level security;

drop policy if exists "Messages viewable by all" on public.channel_messages;
create policy "Messages viewable by all" on public.channel_messages for select using (true);

drop policy if exists "Messages insertable by all" on public.channel_messages;
create policy "Messages insertable by all" on public.channel_messages for insert with check (auth.uid() = user_id);

drop policy if exists "Messages modifiable by admin" on public.channel_messages;
create policy "Messages modifiable by admin" on public.channel_messages for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'))
);
create policy "Messages deletable by admin" on public.channel_messages for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'))
);

-- Channel POSTS (Community Board)
-- Note: Existing table uses 'author_id'
alter table public.channel_posts enable row level security;

drop policy if exists "Posts viewable by all" on public.channel_posts;
create policy "Posts viewable by all" on public.channel_posts for select using (true);

drop policy if exists "Posts insertable by all" on public.channel_posts;
create policy "Posts insertable by all" on public.channel_posts for insert with check (auth.uid() = author_id);

drop policy if exists "Posts modifiable by admin" on public.channel_posts;
create policy "Posts modifiable by admin" on public.channel_posts for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'))
);
create policy "Posts deletable by admin" on public.channel_posts for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'))
);

-- 5. Helper function to check last post time (for 1 week cooldown)
create or replace function public.get_last_post_time(u_id uuid)
returns timestamptz language sql stable as $$
  select created_at 
  from public.channel_posts 
  where author_id = u_id 
  order by created_at desc 
  limit 1;
$$;

-- 6. Helper function to check last message time (for 1 minute slow mode)
create or replace function public.get_last_message_time(u_id uuid)
returns timestamptz language sql stable as $$
  select created_at 
  from public.channel_messages 
  where user_id = u_id 
  order by created_at desc 
  limit 1;
$$;

-- 7. Grant permissions
grant select, insert, update on public.channels to authenticated;
grant select, insert, update, delete on public.channel_messages to authenticated;
grant select, insert, update, delete on public.channel_posts to authenticated;
grant execute on function public.get_last_post_time(uuid) to authenticated;
grant execute on function public.get_last_message_time(uuid) to authenticated;
