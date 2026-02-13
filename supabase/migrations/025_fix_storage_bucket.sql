-- Fix storage bucket creation and policies

-- Drop existing policies if they exist
drop policy if exists "Authenticated users can upload post media" on storage.objects;
drop policy if exists "Public can read post media" on storage.objects;

-- Ensure the bucket exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post_media', 'post_media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Recreate policies
create policy "Authenticated users can upload post media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'post_media');

create policy "Public can read post media"
on storage.objects for select
to public
using (bucket_id = 'post_media');

create policy "Users can update their own post media"
on storage.objects for update
to authenticated
using (bucket_id = 'post_media' and auth.uid() = owner);

create policy "Users can delete their own post media"
on storage.objects for delete
to authenticated
using (bucket_id = 'post_media' and auth.uid() = owner);