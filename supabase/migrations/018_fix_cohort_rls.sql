
-- Allow all authenticated users to view active cohorts (so they can join them)
create policy "Active cohorts viewable by authenticated"
  on public.cohorts
  for select
  to authenticated
  using (active = true);

-- If there's an existing restrictive policy (like "Members only"), this new one acts as an OR condition usually, 
-- or we might need to drop strict ones if they conflict (unlikely for SELECT).
-- But let's ensure we don't have a "deny all" logic.

-- Also ensure 'cohort_memberships' is insertable by authenticated users (to join)
create policy "Users can join cohorts"
  on public.cohort_memberships
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Ensure profiles are updatable by self (to set cohort_id)
create policy "Users can update own profile cohort"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
