create table if not exists public.tool_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  tool_key text not null,
  duration_seconds int,
  meta jsonb,
  created_at timestamptz default now()
);
alter table public.tool_usage_logs enable row level security;

create policy tool_usage_select_self on public.tool_usage_logs 
  for select using (auth.uid() = user_id);

create policy tool_usage_insert_self on public.tool_usage_logs 
  for insert with check (auth.uid() = user_id);

create policy tool_usage_select_staff on public.tool_usage_logs 
  for select using ((select role from public.profiles where id = auth.uid()) in ('staff', 'mentor'));
