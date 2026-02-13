-- Create 'clips' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('clips', 'clips', true)
on conflict (id) do nothing;

-- Policy: Allow public read access to clips
create policy "Public Access Clips"
on storage.objects for select
using ( bucket_id = 'clips' );

-- Policy: Allow authenticated users to upload to clips
create policy "Authenticated Upload Clips"
on storage.objects for insert
with check ( bucket_id = 'clips' and auth.role() = 'authenticated' );

-- Policy: Allow users to update/delete their own files in clips
create policy "Owner Update Clips"
on storage.objects for update
using ( bucket_id = 'clips' and auth.uid() = owner );

create policy "Owner Delete Clips"
on storage.objects for delete
using ( bucket_id = 'clips' and auth.uid() = owner );
