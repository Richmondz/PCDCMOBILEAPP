-- Leaderboard: rank by best Crossy Trivia score this week (resets Sundays)
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
    select date_trunc('week', now()::timestamptz - interval '1 day')::timestamptz + interval '1 day' as start
  ),
  best_scores as (
    select m.user_id, max(m.score)::bigint as best_score
    from minigame_scores m, week_start w
    where m.created_at >= w.start
    group by m.user_id
  ),
  ranked as (
    select
      b.user_id,
      coalesce(p.nickname, 'Anonymous') as nickname,
      b.best_score as weekly_xp,
      row_number() over (order by b.best_score desc) as rank
    from best_scores b
    join profiles p on p.id = b.user_id
  )
  select user_id, nickname, weekly_xp, rank from ranked
  order by rank
  limit 50;
$$;

grant execute on function get_weekly_leaderboard() to authenticated;
grant execute on function get_weekly_leaderboard() to anon;
