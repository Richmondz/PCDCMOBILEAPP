
-- Force insert a cohort to ensure at least one exists
insert into public.cohorts (name, active, description)
values ('Spring 2026', true, 'Default cohort')
on conflict (name) do update set active = true;

-- Ensure channels exist for it
do $$
declare 
  c_id uuid;
begin
  select id into c_id from public.cohorts where name = 'Spring 2026';
  
  if c_id is not null then
    -- General Chat
    insert into public.channels (cohort_id, name, type, slug)
    values (c_id, 'General Chat', 'chat', 'general')
    on conflict (slug) do nothing; -- Note: slug is unique global/per-table based on previous migration attempts?
    -- If slug is unique, we might fail if another cohort has 'general'.
    -- But we only have one cohort ideally.
    -- If slug unique constraint exists, we might need to be careful.
    -- Let's try to find if channel exists by cohort_id + type instead of relying on insert success
    
    if not exists (select 1 from public.channels where cohort_id = c_id and type = 'chat') then
       insert into public.channels (cohort_id, name, type, slug)
       values (c_id, 'General Chat', 'chat', 'general-' || c_id); 
    end if;

    if not exists (select 1 from public.channels where cohort_id = c_id and type = 'posts') then
       insert into public.channels (cohort_id, name, type, slug)
       values (c_id, 'Community Board', 'posts', 'community-' || c_id);
    end if;
  end if;
end $$;
