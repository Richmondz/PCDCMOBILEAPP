-- Ensure users can update their own profile cohort_id
create policy "Users can update own profile cohort"
on public.profiles
for update
to authenticated
using ( auth.uid() = id )
with check ( auth.uid() = id );

-- Ensure users can insert into cohort_memberships for themselves
create policy "Users can join cohorts"
on public.cohort_memberships
for insert
to authenticated
with check ( auth.uid() = user_id );

-- Ensure users can view their own memberships
create policy "Users can view own memberships"
on public.cohort_memberships
for select
to authenticated
using ( auth.uid() = user_id );

-- Ensure users can view all cohorts (to join them)
create policy "Public view cohorts"
on public.cohorts
for select
to authenticated
using ( true );
