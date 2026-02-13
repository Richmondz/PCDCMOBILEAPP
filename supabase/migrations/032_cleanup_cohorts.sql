-- Delete old cohorts
delete from public.cohorts where name like '%2025%';
-- Ensure 2026-2027 exists
insert into public.cohorts (id, name, active)
values ('cohort_2026', '2026-2027 Cohort', true)
on conflict (id) do nothing;
