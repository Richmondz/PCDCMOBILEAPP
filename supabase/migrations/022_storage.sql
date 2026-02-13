
-- Create storage bucket for post media if not exists
insert into storage.buckets (id, name, public)
values ('post_media', 'post_media', true)
on conflict (id) do nothing;

-- Allow authenticated uploads
create policy "Authenticated users can upload post media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'post_media');

-- Allow public read
create policy "Public can read post media"
on storage.objects for select
to public
using (bucket_id = 'post_media');
