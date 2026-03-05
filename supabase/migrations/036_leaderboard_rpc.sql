-- Weekly leaderboard RPC: returns users ranked by weekly XP (resets each week)
-- XP: 25 per check-in, 10 per tool use
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
  checkin_xp as (
    select c.user_id, count(*)::bigint * 25 as xp
    from check_ins c, week_start w
    where c.created_at >= w.start
    group by c.user_id
  ),
  tool_xp as (
    select t.user_id, count(*)::bigint * 10 as xp
    from tool_usage_logs t, week_start w
    where t.created_at >= w.start
    group by t.user_id
  ),
  combined as (
    select 
      coalesce(c.user_id, t.user_id) as user_id,
      coalesce(c.xp, 0) + coalesce(t.xp, 0) as total_xp
    from checkin_xp c
    full outer join tool_xp t on c.user_id = t.user_id
  ),
  ranked as (
    select 
      co.user_id,
      p.nickname,
      co.total_xp as weekly_xp,
      row_number() over (order by co.total_xp desc) as rank
    from combined co
    join profiles p on p.id = co.user_id
    where co.total_xp > 0
  )
  select r.user_id, r.nickname, r.weekly_xp, r.rank from ranked r
  order by r.rank
  limit 50;
$$;

grant execute on function get_weekly_leaderboard() to authenticated;
