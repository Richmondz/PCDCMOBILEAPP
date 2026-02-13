
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
    if not exists (select 1 from public.channels where cohort_id = c_id and type = 'chat') then
       insert into public.channels (cohort_id, name, type, slug)
       values (c_id, 'General Chat', 'chat', 'general'); 
    end if;

    -- Community Board
    if not exists (select 1 from public.channels where cohort_id = c_id and type = 'posts') then
       insert into public.channels (cohort_id, name, type, slug)
       values (c_id, 'Community Board', 'posts', 'community');
    end if;
  end if;
end $$;
