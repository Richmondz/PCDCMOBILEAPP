-- Leaderboard: show all users with profiles, 0 XP if no activity (so list is never empty)
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
  all_users as (
    select p.id as user_id, p.nickname, coalesce(co.total_xp, 0)::bigint as weekly_xp
    from profiles p
    left join combined co on co.user_id = p.id
  ),
  ranked as (
    select 
      user_id,
      nickname,
      weekly_xp,
      row_number() over (order by weekly_xp desc) as rank
    from all_users
  )
  select user_id, nickname, weekly_xp, rank from ranked
  order by rank
  limit 50;
$$;

grant execute on function get_weekly_leaderboard() to authenticated;
