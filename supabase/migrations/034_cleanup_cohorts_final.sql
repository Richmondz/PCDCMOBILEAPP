-- 1. Unlink profiles from old cohorts
update public.profiles
set cohort_id = null
where cohort_id in (select id from public.cohorts where name like '%2025%');

-- 2. Delete memberships for old cohorts
delete from public.cohort_memberships
where cohort_id in (select id from public.cohorts where name like '%2025%');

-- 3. Delete channels (and cascading posts/messages) for old cohorts
delete from public.channels
where cohort_id in (select id from public.cohorts where name like '%2025%');

-- 4. Now safe to delete the old cohorts
delete from public.cohorts
where name like '%2025%';

-- 5. Ensure 2026-2027 exists (using valid UUID)
insert into public.cohorts (id, name, active)
values ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-2027 Cohort', true)
on conflict (id) do nothing;

-- 6. Also ensure at least one channel exists for it
insert into public.channels (id, cohort_id, name, type)
values ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'General', 'chat')
on conflict (id) do nothing;
