-- Fix admin dashboard data visibility for staff, mentor, admin
-- 1. Weekly activity from daily_activity (populated by ActivityTracker every 60s)
--    Use this for "Weekly Time on App" since presence_sessions often has no ended_at on web
create or replace function public.weekly_activity_totals()
returns table(user_id uuid, nickname text, role text, total_minutes int)
language plpgsql security definer
set search_path = public
as $$
begin
  -- Only staff, mentor, admin can call
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff','mentor','admin')
  ) then
    raise exception 'Unauthorized';
  end if;

  return query
  select p.id, p.nickname, p.role::text,
         coalesce(sum(d.minutes_active), 0)::int as total_minutes
  from public.profiles p
  left join public.daily_activity d on d.user_id = p.id
    and d.date >= (current_date - interval '7 days')
    and d.date < current_date
  where p.role in ('teen','mentor','staff','admin')
  group by p.id, p.nickname, p.role;
end;
$$;

-- 2. weekly_presence_totals: make SECURITY DEFINER so it works regardless of RLS
--    and add role check for caller
create or replace function public.weekly_presence_totals(tz text default 'America/New_York')
returns table(user_id uuid, nickname text, role public.user_role, total_seconds int)
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff','mentor','admin')
  ) then
    raise exception 'Unauthorized';
  end if;

  return query
  with bounds as (
    select
      date_trunc('week', timezone(tz, now())) - interval '7 days' as start_local,
      date_trunc('week', timezone(tz, now())) as end_local
  )
  select s.user_id,
         pr.nickname,
         pr.role,
         sum(
           greatest(
             0,
             cast(extract(epoch from least(s.ended_at, (select end_local from bounds) at time zone tz) -
                                 greatest(s.started_at, (select start_local from bounds) at time zone tz)) as int)
           )
         )::int as total_seconds
  from public.presence_sessions s
  join public.profiles pr on pr.id = s.user_id
  where s.ended_at is not null
    and s.started_at < (select end_local from bounds) at time zone tz
    and s.ended_at > (select start_local from bounds) at time zone tz
  group by s.user_id, pr.nickname, pr.role;
end;
$$;

-- 3. RLS: Allow mentor and admin to read presence_sessions (like staff)
drop policy if exists presence_staff_select on public.presence_sessions;
create policy presence_staff_select on public.presence_sessions
  for select using (
    (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
  );

-- 4. RLS: Allow mentor to read daily_activity (for AdminReports and weekly_activity_totals)
drop policy if exists "Staff can view all activity" on public.daily_activity;
create policy "Staff can view all activity" on public.daily_activity
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','mentor','admin'))
  );

-- 5. RLS: Allow mentor/admin to select membership_requests
drop policy if exists memreq_select on public.membership_requests;
create policy memreq_select on public.membership_requests for select using (
  auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
);

-- 6. RLS: Allow mentor/admin to select reports
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select using (
  (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin') or auth.uid() = reporter_id
);

-- 7. RLS: Allow mentor/admin to select and update escalations
drop policy if exists esc_select_staff on public.escalations;
create policy esc_select_staff on public.escalations for select using (
  (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
);
drop policy if exists esc_update_staff on public.escalations;
create policy esc_update_staff on public.escalations for update using (
  (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
);

-- 8. RLS: Allow mentor/admin to select escalation_notes
drop policy if exists escnotes_select on public.escalation_notes;
create policy escnotes_select on public.escalation_notes for select using (
  (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
);

-- 9. RLS: Allow mentor/admin to update reports
drop policy if exists reports_staff_update on public.reports;
create policy reports_staff_update on public.reports for update using (
  (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
);

-- 10. RLS: Allow admin to select tool_usage_logs (Staff already has mentor)
drop policy if exists tool_usage_select_staff on public.tool_usage_logs;
create policy tool_usage_select_staff on public.tool_usage_logs for select using (
  (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
);

-- 11. RLS: Allow mentor/admin to manage daily prompts (Prompt Scheduler)
drop policy if exists daily_prompts_staff_write on public.daily_prompts;
create policy daily_prompts_staff_write on public.daily_prompts for all using (
  (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
);

-- 12. RLS: Allow mentor/admin to manage cohort memberships (approve requests)
drop policy if exists cohort_memberships_select on public.cohort_memberships;
create policy cohort_memberships_select on public.cohort_memberships for select using (
  auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
);
drop policy if exists cohort_memberships_staff_write on public.cohort_memberships;
create policy cohort_memberships_staff_write on public.cohort_memberships for all using (
  (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
);

-- 13. RLS: Allow mentor/admin to update membership_requests (approve/deny)
drop policy if exists memreq_staff_update on public.membership_requests;
create policy memreq_staff_update on public.membership_requests for update using (
  (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
);

-- 14. RLS: Allow mentor/admin to insert audit_logs
drop policy if exists audit_staff_insert on public.audit_logs;
create policy audit_staff_insert on public.audit_logs for insert with check (
  (select role from public.profiles where id = auth.uid()) in ('staff','mentor','admin')
);
