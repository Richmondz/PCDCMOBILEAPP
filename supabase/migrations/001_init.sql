-- Schema and RLS for PCDC Teen Club Connect
create extension if not exists pgcrypto;

-- Roles enum
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('teen','mentor','staff');
  end if;
end $$;

-- Helper to check blocks
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'teen',
  nickname text not null,
  grade text,
  tags text[] default '{}',
  language_pref text default 'en',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = id);

-- Cohorts
create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true
);
alter table public.cohorts enable row level security;

-- Cohort memberships
create table if not exists public.cohort_memberships (
  cohort_id uuid references public.cohorts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  status text default 'active',
  joined_at timestamptz not null default now(),
  primary key (cohort_id, user_id)
);
alter table public.cohort_memberships enable row level security;

-- Channels
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  name text not null,
  visibility text default 'members'
);
alter table public.channels enable row level security;

-- Channel posts
create table if not exists public.channel_posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  media_url text,
  anonymous boolean default false,
  created_at timestamptz not null default now()
);
alter table public.channel_posts enable row level security;

-- Reactions
create table if not exists public.reactions (
  post_id uuid references public.channel_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  reaction_type text not null,
  primary key (post_id, user_id, reaction_type)
);
alter table public.reactions enable row level security;

-- Mentor assignments
create table if not exists public.mentor_assignments (
  teen_id uuid references public.profiles(id) on delete cascade,
  mentor_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teen_id, mentor_id)
);
alter table public.mentor_assignments enable row level security;

-- Check-ins
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mood int not null check (mood between 1 and 5),
  tags text[] default '{}',
  note text,
  created_at timestamptz not null default now()
);
alter table public.check_ins enable row level security;

-- Journal entries
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  share_to_mentor boolean default false,
  created_at timestamptz not null default now()
);
alter table public.journal_entries enable row level security;

-- Clips
create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  created_at timestamptz not null default now(),
  active_date date
);
alter table public.clips enable row level security;

-- Clip bookmarks
create table if not exists public.clip_bookmarks (
  clip_id uuid references public.clips(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (clip_id, user_id)
);
alter table public.clip_bookmarks enable row level security;

-- Resources
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.resources enable row level security;

-- Conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.conversations enable row level security;

-- Conversation members
create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role_in_thread text,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);
alter table public.conversation_members enable row level security;

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;

-- Blocks
create table if not exists public.blocks (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.blocks enable row level security;

-- Reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('user','post','message','clip')),
  target_id uuid not null,
  reason text,
  details text,
  status text not null default 'open' check (status in ('open','in_review','resolved')),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;

-- Staff notes
create table if not exists public.staff_notes (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.profiles(id) on delete set null,
  report_id uuid references public.reports(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);
alter table public.staff_notes enable row level security;

-- Indexes
create index if not exists idx_posts_channel on public.channel_posts(channel_id);
create index if not exists idx_posts_author on public.channel_posts(author_id);
create index if not exists idx_posts_created on public.channel_posts(created_at);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_created on public.messages(created_at);
create index if not exists idx_convmembers_user on public.conversation_members(user_id);
create index if not exists idx_assignments_teen on public.mentor_assignments(teen_id);
create index if not exists idx_assignments_mentor on public.mentor_assignments(mentor_id);
create index if not exists idx_memreq_cohort on public.membership_requests(cohort_id);
create index if not exists idx_memreq_status on public.membership_requests(status);
create index if not exists idx_memreq_created on public.membership_requests(created_at);
create index if not exists idx_escalations_status on public.escalations(status);
create index if not exists idx_escalations_severity on public.escalations(severity);
create index if not exists idx_escalations_created on public.escalations(created_at);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_created on public.reports(created_at);

-- RLS Policies
-- profiles: users can select/update own; staff can update any; mentors can select assigned teens
create policy profiles_auth_only on public.profiles
  for select using (auth.uid() is not null);
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id);
create policy profiles_staff_update on public.profiles
  for update using ((select role from public.profiles where id = auth.uid()) = 'staff');
create index if not exists idx_profiles_role on public.profiles(role);

-- cohorts: staff full, mentors select where they have assigned teens or are members; teens select where members
create policy cohorts_auth_only on public.cohorts for select using (auth.uid() is not null);
create policy cohorts_staff_write on public.cohorts for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- cohort_memberships: select where user is member OR staff; insert by staff; delete by staff
create policy cohort_memberships_select on public.cohort_memberships
  for select using (
    auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'staff'
  );
create policy cohort_memberships_staff_write on public.cohort_memberships
  for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- channels: select where in cohort (member or staff); insert/update by staff/mentors (assigned to cohort via membership); delete staff
create policy channels_select on public.channels
  for select using (
    (select role from public.profiles where id = auth.uid()) = 'staff'
    or exists (select 1 from public.cohort_memberships m where m.cohort_id = cohort_id and m.user_id = auth.uid())
  );
create policy channels_staff_write on public.channels for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- channel_posts: select where channel visible and not blocked; insert if member of cohort; mentors/staff can post in announcements; anonymous allowed only in Ask channel (enforced by app)
create policy posts_select on public.channel_posts
  for select using (
    not public.is_blocked(author_id, auth.uid()) and (
      (select role from public.profiles where id = auth.uid()) = 'staff'
      or exists (
        select 1 from public.channels c
        join public.cohort_memberships m on m.cohort_id = c.cohort_id
        where c.id = channel_id and m.user_id = auth.uid()
      )
    )
  );
create policy posts_insert on public.channel_posts
  for insert with check (
    exists (
      select 1 from public.channels c
      join public.cohort_memberships m on m.cohort_id = c.cohort_id
      where c.id = channel_id and m.user_id = auth.uid()
    )
  );
create policy posts_update_author_or_staff on public.channel_posts
  for update using (auth.uid() = author_id or (select role from public.profiles where id = auth.uid()) = 'staff');

-- reactions: only members; prevent blocked
create policy reactions_select on public.reactions for select using (auth.uid() is not null);
create policy reactions_write on public.reactions for all using (
  not public.is_blocked(user_id, auth.uid()) and exists (
    select 1 from public.channels c
    join public.cohort_memberships m on m.cohort_id = c.cohort_id
    join public.channel_posts p on p.channel_id = c.id
    where p.id = post_id and m.user_id = auth.uid()
  )
);

-- mentor_assignments: staff manage; mentors/staff select; teens select own
create policy assignments_select on public.mentor_assignments for select using (
  (select role from public.profiles where id = auth.uid()) in ('mentor','staff')
  or auth.uid() = teen_id
);
create policy assignments_staff_write on public.mentor_assignments for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- check_ins: user can read/write own; mentors/staff can read assigned teens; staff read all
create policy checkins_select on public.check_ins for select using (
  auth.uid() = user_id
  or (select role from public.profiles where id = auth.uid()) = 'staff'
  or exists (select 1 from public.mentor_assignments ma where ma.teen_id = user_id and ma.mentor_id = auth.uid())
);
create policy checkins_insert on public.check_ins for insert with check (auth.uid() = user_id);

-- journal_entries: same as check_ins for select; insert by owner
create policy journal_select on public.journal_entries for select using (
  auth.uid() = user_id
  or (select role from public.profiles where id = auth.uid()) = 'staff'
  or (share_to_mentor and exists (select 1 from public.mentor_assignments ma where ma.teen_id = user_id and ma.mentor_id = auth.uid()))
);
create policy journal_insert on public.journal_entries for insert with check (auth.uid() = user_id);

-- clips: read all authenticated; write mentors/staff
create policy clips_select on public.clips for select using (auth.uid() is not null);
create policy clips_write on public.clips for all using ((select role from public.profiles where id = auth.uid()) in ('mentor','staff'));

-- clip_bookmarks: user write own; select own
create policy clip_bookmarks_select on public.clip_bookmarks for select using (auth.uid() = user_id);
create policy clip_bookmarks_write on public.clip_bookmarks for all using (auth.uid() = user_id);

-- resources: read all authenticated; write staff
create policy resources_select on public.resources for select using (auth.uid() is not null);
create policy resources_write on public.resources for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- conversations: select only if member; insert allowed only if creating allowed pair (teen+mentor/staff)
create policy conversations_select on public.conversations for select using (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = id and cm.user_id = auth.uid())
);
-- restrict direct conversation insert to staff; others use RPC create_dm
create policy conversations_insert_staff_only on public.conversations for insert with check (
  (select role from public.profiles where id = auth.uid()) = 'staff'
);

-- conversation_members: select own conversations; write staff; insert for allowed pairs
create policy convmembers_select on public.conversation_members for select using (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid())
);
create policy convmembers_insert_staff_only on public.conversation_members for insert with check (
  (select role from public.profiles where id = auth.uid()) = 'staff'
);
create policy convmembers_staff_write on public.conversation_members for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- messages: only members; block enforcement
create policy messages_select on public.messages for select using (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid())
  and not public.is_blocked(sender_id, auth.uid())
);
create policy messages_insert on public.messages for insert with check (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid())
);

-- RPC: create_dm allows users to start conversations
-- Logic:
-- 1. Check if blocked
-- 2. If target is blocked by me or I am blocked by target -> error
-- 3. If conversation already exists between exactly these 2 users -> return it
-- 4. Create new conversation
create or replace function public.create_dm(target uuid)
returns uuid language plpgsql security definer as $$
declare con_id uuid;
declare me uuid := auth.uid();
begin
  -- Check for blocks
  if exists (select 1 from public.blocks where (blocker_id = me and blocked_id = target) or (blocker_id = target and blocked_id = me)) then
    raise exception 'Cannot message this user';
  end if;

  -- Check existing 1:1 conversation
  select c.id into con_id
  from public.conversations c
  join public.conversation_members m1 on m1.conversation_id = c.id and m1.user_id = me
  join public.conversation_members m2 on m2.conversation_id = c.id and m2.user_id = target
  group by c.id
  having count(distinct c.id) = 1; -- Simplified check, ideally check member count = 2

  if con_id is not null then
    return con_id;
  end if;

  -- Create new
  insert into public.conversations default values returning id into con_id;
  insert into public.conversation_members(conversation_id, user_id) values (con_id, me);
  insert into public.conversation_members(conversation_id, user_id) values (con_id, target);
  return con_id;
end $$;

-- blocks: user manage own; staff select all
create policy blocks_select on public.blocks for select using (
  auth.uid() = blocker_id or auth.uid() = blocked_id or (select role from public.profiles where id = auth.uid()) = 'staff'
);
create policy blocks_write on public.blocks for all using (auth.uid() = blocker_id);

-- reports: reporter sees own; staff sees all; insert by any authenticated
create policy reports_select on public.reports for select using (
  (select role from public.profiles where id = auth.uid()) = 'staff' or auth.uid() = reporter_id
);
create policy reports_insert on public.reports for insert with check (auth.uid() is not null);
create policy reports_staff_update on public.reports for update using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- staff_notes: staff only
create policy staff_notes_select on public.staff_notes for select using ((select role from public.profiles where id = auth.uid()) = 'staff');
create policy staff_notes_write on public.staff_notes for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- Daily prompts
create table if not exists public.daily_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  active_date date not null unique,
  created_at timestamptz default now()
);
alter table public.daily_prompts enable row level security;
create policy daily_prompts_select on public.daily_prompts for select using (auth.uid() is not null);
create policy daily_prompts_staff_write on public.daily_prompts for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- Saved tools
create table if not exists public.saved_tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tool_key text not null,
  created_at timestamptz default now(),
  unique(user_id, tool_key)
);
alter table public.saved_tools enable row level security;
create policy saved_tools_select on public.saved_tools for select using (auth.uid() = user_id);
create policy saved_tools_write on public.saved_tools for all using (auth.uid() = user_id);

-- Device tokens
create table if not exists public.device_tokens (
  user_id uuid references public.profiles(id) on delete cascade,
  token text not null,
  created_at timestamptz default now(),
  primary key (user_id, token)
);
alter table public.device_tokens enable row level security;
create policy device_tokens_select on public.device_tokens for select using (auth.uid() = user_id);
create policy device_tokens_write on public.device_tokens for all using (auth.uid() = user_id);

-- Office hours (MVP-lite)
create table if not exists public.office_hours (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id) on delete cascade,
  teen_id uuid references public.profiles(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested','approved','declined')),
  created_at timestamptz default now()
);
alter table public.office_hours enable row level security;
create policy office_hours_select on public.office_hours for select using (
  auth.uid() in (mentor_id, teen_id) or (select role from public.profiles where id = auth.uid()) = 'staff'
);
create policy office_hours_write_staff_mentor on public.office_hours for all using (
  (select role from public.profiles where id = auth.uid()) in ('mentor','staff')
);

-- Weekly recaps
create table if not exists public.weekly_recaps (
  user_id uuid references public.profiles(id) on delete cascade,
  week_start date not null,
  checkins_count int not null default 0,
  tools_count int not null default 0,
  mentor_msgs_count int not null default 0,
  created_at timestamptz default now(),
  primary key (user_id, week_start)
);
alter table public.weekly_recaps enable row level security;
create policy weekly_recaps_self on public.weekly_recaps for all using (auth.uid() = user_id);

-- Profiles extra columns
alter table public.profiles add column if not exists onboarding_complete boolean default false;
alter table public.profiles add column if not exists guardian_consented boolean default false;

-- Membership requests
create table if not exists public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references public.cohorts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);
alter table public.membership_requests enable row level security;
create policy memreq_select on public.membership_requests for select using (
  auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'staff'
);
create policy memreq_insert on public.membership_requests for insert with check (auth.uid() = user_id);
create policy memreq_staff_update on public.membership_requests for update using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  meta jsonb,
  created_at timestamptz default now()
);
alter table public.audit_logs enable row level security;
create policy audit_staff_select on public.audit_logs for select using ((select role from public.profiles where id = auth.uid()) = 'staff');
create policy audit_staff_insert on public.audit_logs for insert with check ((select role from public.profiles where id = auth.uid()) = 'staff');

-- Content guidelines acceptance
create table if not exists public.guidelines_acceptance (
  user_id uuid references public.profiles(id) on delete cascade,
  accepted_at timestamptz default now(),
  primary key (user_id)
);
alter table public.guidelines_acceptance enable row level security;
create policy guide_self on public.guidelines_acceptance for all using (auth.uid() = user_id);

-- Sensitive flags
create table if not exists public.sensitive_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  context text not null,
  context_id uuid not null,
  keyword text not null,
  created_at timestamptz default now()
);
alter table public.sensitive_flags enable row level security;
create policy flags_staff_select on public.sensitive_flags for select using ((select role from public.profiles where id = auth.uid()) = 'staff');
create policy flags_insert_auth on public.sensitive_flags for insert with check (auth.uid() is not null);

-- Saved resources
create table if not exists public.saved_resources (
  resource_id uuid references public.resources(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (resource_id, user_id)
);
alter table public.saved_resources enable row level security;
create policy saved_resources_self on public.saved_resources for all using (auth.uid() = user_id);

-- Cohort challenges
create table if not exists public.cohort_challenges (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references public.cohorts(id) on delete cascade,
  title text not null,
  type text not null,
  target int not null,
  start_date date not null,
  end_date date not null,
  created_by uuid references public.profiles(id) on delete set null
);
alter table public.cohort_challenges enable row level security;
create policy ch_select on public.cohort_challenges for select using (
  (select role from public.profiles where id = auth.uid()) = 'staff' or exists (
    select 1 from public.cohort_memberships m where m.cohort_id = cohort_id and m.user_id = auth.uid()
  )
);
create policy ch_staff_write on public.cohort_challenges for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- Escalations
create table if not exists public.escalations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  post_id uuid references public.channel_posts(id) on delete cascade,
  mentor_id uuid references public.profiles(id) on delete set null,
  reason text,
  severity text not null default 'medium' check (severity in ('low','medium','high')),
  status text not null default 'open' check (status in ('open','in_review','resolved')),
  created_at timestamptz default now()
);
alter table public.escalations enable row level security;
create policy esc_select_staff on public.escalations for select using ((select role from public.profiles where id = auth.uid()) = 'staff');
create policy esc_insert_mentor_staff on public.escalations for insert with check ((select role from public.profiles where id = auth.uid()) in ('mentor','staff'));
create policy esc_update_staff on public.escalations for update using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- Escalation notes
create table if not exists public.escalation_notes (
  id uuid primary key default gen_random_uuid(),
  escalation_id uuid references public.escalations(id) on delete cascade,
  staff_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz default now()
);
alter table public.escalation_notes enable row level security;
create policy escnotes_select on public.escalation_notes for select using ((select role from public.profiles where id = auth.uid()) = 'staff');
create policy escnotes_write on public.escalation_notes for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

-- Push settings on profiles
alter table public.profiles add column if not exists push_enabled boolean default true;
alter table public.profiles add column if not exists quiet_hours_start time;
alter table public.profiles add column if not exists quiet_hours_end time;

alter table public.profiles add column if not exists mentor_capacity int default 0;

alter table public.channel_posts add column if not exists deleted_at timestamptz;

create table if not exists public.cohort_mutes (
  cohort_id uuid references public.cohorts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  until timestamptz not null,
  created_at timestamptz default now(),
  primary key (cohort_id, user_id)
);
alter table public.cohort_mutes enable row level security;
create policy mutes_staff on public.cohort_mutes for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

create table if not exists public.channel_locks (
  channel_id uuid references public.channels(id) on delete cascade,
  until timestamptz not null,
  created_at timestamptz default now(),
  primary key (channel_id)
);
alter table public.channel_locks enable row level security;
create policy locks_staff on public.channel_locks for all using ((select role from public.profiles where id = auth.uid()) = 'staff');

create table if not exists public.office_slots (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  available boolean default true,
  created_at timestamptz default now()
);
alter table public.office_slots enable row level security;
create policy slots_select on public.office_slots for select using (
  (select role from public.profiles where id = auth.uid()) in ('mentor','staff') or exists (select 1 from public.mentor_assignments ma where ma.teen_id = auth.uid() and ma.mentor_id = mentor_id)
);
create policy slots_write on public.office_slots for all using ((select role from public.profiles where id = auth.uid()) in ('mentor','staff'));

alter table public.office_hours add column if not exists slot_id uuid references public.office_slots(id) on delete set null;
