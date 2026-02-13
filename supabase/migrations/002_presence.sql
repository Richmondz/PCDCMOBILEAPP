-- Presence sessions and helpers
create table if not exists public.presence_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int
);
alter table public.presence_sessions enable row level security;

create index if not exists idx_presence_user on public.presence_sessions(user_id);
create index if not exists idx_presence_started on public.presence_sessions(started_at);
create index if not exists idx_presence_ended on public.presence_sessions(ended_at);
create index if not exists idx_presence_heartbeat on public.presence_sessions(last_heartbeat_at);

drop policy if exists presence_insert_self on public.presence_sessions;
create policy presence_insert_self on public.presence_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists presence_select_self on public.presence_sessions;
create policy presence_select_self on public.presence_sessions
  for select using (auth.uid() = user_id);

drop policy if exists presence_update_self on public.presence_sessions;
create policy presence_update_self on public.presence_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists presence_staff_select on public.presence_sessions;
create policy presence_staff_select on public.presence_sessions
  for select using ((select role from public.profiles where id = auth.uid()) = 'staff');

drop policy if exists presence_staff_update on public.presence_sessions;
create policy presence_staff_update on public.presence_sessions
  for update using ((select role from public.profiles where id = auth.uid()) = 'staff');

create or replace function public.presence_compute_duration()
returns trigger language plpgsql as $$
begin
  if new.ended_at is not null then
    new.duration_seconds := coalesce(new.duration_seconds, greatest(0, cast(extract(epoch from new.ended_at - new.started_at) as int)));
  end if;
  return new;
end$$;

drop trigger if exists trg_presence_duration on public.presence_sessions;
create trigger trg_presence_duration before update of ended_at on public.presence_sessions
for each row execute function public.presence_compute_duration();

create or replace function public.close_stale_sessions(timeout_seconds int default 120)
returns int language plpgsql security definer as $$
declare cnt int := 0;
begin
  update public.presence_sessions s
  set ended_at = s.last_heartbeat_at
  where s.ended_at is null and now() - s.last_heartbeat_at > (timeout_seconds || ' seconds')::interval;
  get diagnostics cnt = row_count;
  return cnt;
end$$;

create or replace function public.weekly_presence_totals(tz text default 'America/New_York')
returns table(user_id uuid, nickname text, role public.user_role, total_seconds int) language sql as $$
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
  group by s.user_id, pr.nickname, pr.role
$$;

create or replace function public.user_online_status(check_uid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.presence_sessions
    where user_id = check_uid
      and ended_at is null
      and last_heartbeat_at > (now() - interval '2 minutes')
  );
$$;
