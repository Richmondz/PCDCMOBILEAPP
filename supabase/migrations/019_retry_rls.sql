
-- Retry: Allow all authenticated users to view active cohorts
create policy "Active cohorts viewable by authenticated"
  on public.cohorts
  for select
  to authenticated
  using (active = true);

-- Retry: Ensure 'cohort_memberships' is insertable
create policy "Users can join cohorts"
  on public.cohort_memberships
  for insert
  to authenticated
  with check (auth.uid() = user_id);
