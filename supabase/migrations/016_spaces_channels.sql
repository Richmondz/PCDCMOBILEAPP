
-- 1. Create a table for global channels if not exists
-- (We might already have 'channels', let's check or recreate safe)
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type text check (type in ('chat', 'posts')) not null,
  created_at timestamptz default now()
);

-- 2. Create tables for channel messages and posts if not exists
-- General Chat Messages
create table if not exists public.channel_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  is_hidden boolean default false
);

-- Community Posts (distinct from chat messages to handle different rules/cooldowns easily)
create table if not exists public.channel_posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  is_hidden boolean default false
);

-- 3. RLS Policies
alter table public.channels enable row level security;
alter table public.channel_messages enable row level security;
alter table public.channel_posts enable row level security;

-- Channels: Readable by all authenticated
create policy "Channels viewable by all" on public.channels for select using (true);

-- Messages: Readable by all
create policy "Messages viewable by all" on public.channel_messages for select using (true);
-- Messages: Insertable by authenticated (rate limit handled in app/function, but basic policy here)
create policy "Messages insertable by all" on public.channel_messages for insert with check (auth.uid() = user_id);
-- Messages: Update/Delete only by Admin or Owner (logic in app, but policy allows admins)
-- (We'll use a function for admin actions to be safe/easy, or simple policy)
create policy "Messages modifiable by admin" on public.channel_messages for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'))
);

-- Posts: Readable by all
create policy "Posts viewable by all" on public.channel_posts for select using (true);
-- Posts: Insertable by authenticated
create policy "Posts insertable by all" on public.channel_posts for insert with check (auth.uid() = user_id);
-- Posts: Modifiable by admin
create policy "Posts modifiable by admin" on public.channel_posts for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'))
);

-- 4. Seed default channels
insert into public.channels (slug, name, type)
values 
  ('general', 'General Chat', 'chat'),
  ('community', 'Community Board', 'posts')
on conflict (slug) do nothing;

-- 5. Helper function to check last post time (for 1 week cooldown)
create or replace function public.get_last_post_time(u_id uuid)
returns timestamptz language sql stable as $$
  select created_at 
  from public.channel_posts 
  where user_id = u_id 
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
grant select, insert, update on public.channel_messages to authenticated;
grant select, insert, update on public.channel_posts to authenticated;
grant execute on function public.get_last_post_time(uuid) to authenticated;
grant execute on function public.get_last_message_time(uuid) to authenticated;
