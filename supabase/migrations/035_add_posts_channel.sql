-- Ensure Community Posts channel exists for the 2026 cohort
insert into public.channels (id, cohort_id, name, type)
values 
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Community', 'posts')
on conflict (id) do nothing;

-- Also ensure General chat exists (just in case)
insert into public.channels (id, cohort_id, name, type)
values 
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'General', 'chat')
on conflict (id) do nothing;
