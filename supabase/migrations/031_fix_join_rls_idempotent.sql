-- Drop policies if they exist to avoid conflicts (and ensure we have the correct definition)
drop policy if exists "Users can update own profile cohort" on public.profiles;
drop policy if exists "Users can join cohorts" on public.cohort_memberships;
drop policy if exists "Users can view own memberships" on public.cohort_memberships;
drop policy if exists "Public view cohorts" on public.cohorts;

-- Recreate policies
create policy "Users can update own profile cohort"
on public.profiles
for update
to authenticated
using ( auth.uid() = id )
with check ( auth.uid() = id );

create policy "Users can join cohorts"
on public.cohort_memberships
for insert
to authenticated
with check ( auth.uid() = user_id );

create policy "Users can view own memberships"
on public.cohort_memberships
for select
to authenticated
using ( auth.uid() = user_id );

create policy "Public view cohorts"
on public.cohorts
for select
to authenticated
using ( true );
