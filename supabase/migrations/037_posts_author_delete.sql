-- Allow authors to delete their own community posts (in addition to admins)
create policy "Posts deletable by author"
  on public.channel_posts for delete
  using (auth.uid() = author_id);
