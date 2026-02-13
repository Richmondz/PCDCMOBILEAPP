-- 1. Unlink profiles from old cohorts
update public.profiles
set cohort_id = null
where cohort_id in (select id from public.cohorts where name like '%2025%');

-- 2. Delete memberships for old cohorts
delete from public.cohort_memberships
where cohort_id in (select id from public.cohorts where name like '%2025%');

-- 3. Delete channels (and cascading posts/messages) for old cohorts
-- Note: Requires cascading delete on foreign keys. If not set, we delete manually.
delete from public.channels
where cohort_id in (select id from public.cohorts where name like '%2025%');

-- 4. Now safe to delete the old cohorts
delete from public.cohorts
where name like '%2025%';

-- 5. Ensure 2026-2027 exists
insert into public.cohorts (id, name, active)
values ('cohort_2026', '2026-2027 Cohort', true)
on conflict (id) do nothing;
