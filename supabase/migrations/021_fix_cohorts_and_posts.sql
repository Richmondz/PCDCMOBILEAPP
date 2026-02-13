
-- 1. Ensure channel_posts has channel_id
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='channel_posts' and column_name='channel_id') then
    alter table public.channel_posts add column channel_id uuid references public.channels(id) on delete cascade;
  end if;
end $$;

-- 2. Seed correct cohorts
insert into public.cohorts (name, active, description)
values 
  ('2025-2026 Cohort', true, 'High school cohort for 2025-2026'),
  ('2026-2027 Cohort', true, 'High school cohort for 2026-2027')
on conflict (name) do update set active = true;

-- 3. Ensure channels for ALL active cohorts
do $$
declare 
  c record;
begin
  for c in select id from public.cohorts where active = true loop
    -- General Chat
    if not exists (select 1 from public.channels where cohort_id = c.id and type = 'chat') then
       insert into public.channels (cohort_id, name, type, slug)
       values (c.id, 'General Chat', 'chat', 'general-' || c.id); 
    end if;

    -- Community Board
    if not exists (select 1 from public.channels where cohort_id = c.id and type = 'posts') then
       insert into public.channels (cohort_id, name, type, slug)
       values (c.id, 'Community Board', 'posts', 'community-' || c.id);
    end if;
  end loop;
end $$;

-- 4. Re-apply RLS for posts to be safe
drop policy if exists "Posts insertable by all" on public.channel_posts;
create policy "Posts insertable by all" on public.channel_posts for insert with check (auth.uid() = author_id);

drop policy if exists "Posts viewable by all" on public.channel_posts;
create policy "Posts viewable by all" on public.channel_posts for select using (true);
