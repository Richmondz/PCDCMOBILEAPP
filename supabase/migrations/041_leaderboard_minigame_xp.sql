-- Leaderboard: rank by Crossy Road XP (score + roads*5 + trivia*20), best per user per week
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
  select user_id, nickname, weekly_xp, rank from ranked
  order by rank
  limit 50;
$$;

grant execute on function get_weekly_leaderboard() to authenticated;
grant execute on function get_weekly_leaderboard() to anon;
