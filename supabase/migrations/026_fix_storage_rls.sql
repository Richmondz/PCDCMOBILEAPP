-- Fix storage RLS policies

-- Enable RLS on storage.objects if not already enabled
alter table storage.objects enable row level security;

-- Drop existing policies
drop policy if exists "Authenticated users can upload post media" on storage.objects;
drop policy if exists "Public can read post media" on storage.objects;
drop policy if exists "Users can update their own post media" on storage.objects;
drop policy if exists "Users can delete their own post media" on storage.objects;

-- Create proper policies
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