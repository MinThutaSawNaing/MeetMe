-- Supabase Storage Configuration for Stories

-- Create the stories bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('stories', 'stories', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the stories bucket
CREATE POLICY "Allow public read access to stories" ON storage.objects FOR SELECT TO public USING (bucket_id = 'stories');

CREATE POLICY "Allow authenticated users to upload stories" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'stories');

CREATE POLICY "Allow users to update their own stories" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'stories');

CREATE POLICY "Allow users to delete their own stories" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'stories');