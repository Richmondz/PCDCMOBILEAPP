-- Minigame scores for Crossy Trivia leaderboard
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

create policy minigame_scores_insert_self on public.minigame_scores
  for insert with check (auth.uid() = user_id);

create policy minigame_scores_select_all on public.minigame_scores
  for select using (true);
