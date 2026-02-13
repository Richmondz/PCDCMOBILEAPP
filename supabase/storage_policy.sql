-- Storage buckets and policies
insert into storage.buckets (id, name) values ('clips','clips') on conflict (id) do nothing;
insert into storage.buckets (id, name) values ('post_media','post_media') on conflict (id) do nothing;

-- Authenticated can read
create policy "clips read" on storage.objects for select using (
  bucket_id = 'clips' and auth.uid() is not null
);
create policy "post_media read" on storage.objects for select using (
  bucket_id = 'post_media' and auth.uid() is not null
);

-- Write restrictions
create policy "clips write mentors_staff" on storage.objects for insert with check (
  bucket_id = 'clips' and (select role from public.profiles where id = auth.uid()) in ('mentor','staff')
);
create policy "post_media write members" on storage.objects for insert with check (
  bucket_id = 'post_media' and auth.uid() is not null
);

