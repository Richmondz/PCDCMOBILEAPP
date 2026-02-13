
-- Insert a default cohort if the table is empty
insert into public.cohorts (name, active, description)
select 'Spring 2026', true, 'Default cohort for new users'
where not exists (select 1 from public.cohorts);

-- Ensure channels exist for ALL cohorts (including the new one if created)
-- Re-run the backfill logic safely
do $$
declare 
  c record;
begin
  for c in select id from public.cohorts loop
    -- Create General Chat
    insert into public.channels (cohort_id, name, type, slug)
    select c.id, 'General Chat', 'chat', 'general'
    where not exists (
      select 1 from public.channels 
      where cohort_id = c.id and type = 'chat'
    );

    -- Create Community Board
    insert into public.channels (cohort_id, name, type, slug)
    select c.id, 'Community Board', 'posts', 'community'
    where not exists (
      select 1 from public.channels 
      where cohort_id = c.id and type = 'posts'
    );
  end loop;
end $$;
