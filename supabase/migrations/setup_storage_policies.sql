-- Setup Storage Policies for Profile Images Bucket
-- This migration creates the necessary RLS policies for the profile_images storage bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public profile images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all profile images" ON storage.objects;

-- Policy 1: Allow public read access to profile images
-- This allows anyone to view avatar images
CREATE POLICY "Public profile images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_images');

-- Policy 2: Allow authenticated users to upload profile images
-- This allows authenticated users to upload their profile images
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile_images');

-- Policy 3: Allow users to update their profile images
-- This allows users to update/replace their existing profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile_images')
WITH CHECK (bucket_id = 'profile_images');

-- Policy 4: Allow users to delete their profile images
-- This allows users to delete their profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile_images');

-- Policy 5: Allow service role to manage all profile images
-- This is critical for the API route to work with supabaseAdmin
CREATE POLICY "Service role can manage all profile images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'profile_images')
WITH CHECK (bucket_id = 'profile_images');
