-- Supabase Storage Configuration for Avatars

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/*'], NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the avatars bucket

-- Allow public read access to avatars (needed for displaying avatars)
CREATE POLICY "Allow public read access to avatars" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated users to upload avatars" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Allow users to update their own avatars
CREATE POLICY "Allow users to update their own avatars" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own avatars
CREATE POLICY "Allow users to delete their own avatars" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);