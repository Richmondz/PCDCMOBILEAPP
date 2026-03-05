-- Run this in Supabase SQL Editor to enable the Crossy Road leaderboard
-- Copy and paste the entire file, then click Run

-- 1. Create minigame_scores table (if not exists)
create table if not exists public.minigame_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score int not null,
  roads_crossed int not null default 0,
  trivia_correct int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_minigame_scores_user_created on public.minigame_scores(user_id, created_at desc);

alter table public.minigame_scores enable row level security;

drop policy if exists minigame_scores_insert_self on public.minigame_scores;
create policy minigame_scores_insert_self on public.minigame_scores
  for insert with check (auth.uid() = user_id);

drop policy if exists minigame_scores_select_all on public.minigame_scores;
create policy minigame_scores_select_all on public.minigame_scores
  for select using (true);

-- 2. Leaderboard RPC: rank by Crossy Road XP (score + roads*5 + trivia*20)
create or replace function get_weekly_leaderboard()
returns table (
  user_id uuid,
  nickname text,
  weekly_xp bigint,
  rank bigint
)
language sql
security definer
set search_path = public
as $$
  with week_start as (
    select date_trunc('week', now()::timestamptz) as start
  ),
  game_xp as (
    select
      m.user_id,
      (m.score + coalesce(m.roads_crossed, 0) * 5 + coalesce(m.trivia_correct, 0) * 20)::bigint as xp
    from minigame_scores m, week_start w
    where m.created_at >= w.start
  ),
  best_xp as (
    select user_id, max(xp)::bigint as weekly_xp
    from game_xp
    group by user_id
  ),
  ranked as (
    select
      b.user_id,
      coalesce(p.nickname, 'Anonymous') as nickname,
      b.weekly_xp,
      row_number() over (order by b.weekly_xp desc) as rank
    from best_xp b
    join profiles p on p.id = b.user_id
  )
  select ranked.user_id, ranked.nickname, ranked.weekly_xp, ranked.rank from ranked
  order by ranked.rank
  limit 50;
$$;

grant execute on function get_weekly_leaderboard() to authenticated;
grant execute on function get_weekly_leaderboard() to anon;
