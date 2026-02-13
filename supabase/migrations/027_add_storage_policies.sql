-- Add missing storage policies for post_media

-- Use DO block to avoid errors if policies already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own post media'
    ) THEN
        create policy "Users can update their own post media"
        on storage.objects for update
        to authenticated
        using (bucket_id = 'post_media' and auth.uid() = owner);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own post media'
    ) THEN
        create policy "Users can delete their own post media"
        on storage.objects for delete
        to authenticated
        using (bucket_id = 'post_media' and auth.uid() = owner);
    END IF;
END
$$;