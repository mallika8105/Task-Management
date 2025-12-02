# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for avatar uploads in your Task Management System.

## Prerequisites

- Supabase project created
- Database tables set up
- Supabase URL and Anon Key configured in `.env.local`

## Step 1: Verify Your Storage Bucket

You should already have a bucket named `profile_images` (marked as Public). If not:

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `profile_images`
   - **Public**: ✅ **Enable** (so avatar images are publicly accessible)
   - **File size limit**: 5242880 bytes (5 MB)
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg, image/webp`

5. Click **Create bucket**

## Step 2: Set Up Storage Policies (REQUIRED)

After creating the bucket, you **must** set up Row Level Security (RLS) policies for the storage bucket to fix the "new row violates row-level security policy" error.

### Option A: Run the Migration File (Recommended)

The easiest way to set up the policies is to run the migration file provided:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `supabase/migrations/setup_storage_policies.sql` from your project
5. Copy and paste the entire contents into the SQL Editor
6. Click **Run** to execute the migration
7. Verify that all 5 policies were created successfully

### Option B: Manual Setup via Dashboard

Alternatively, you can set up policies manually:

1. In your Supabase Dashboard, go to **Storage** → **Policies**
2. Select the `profile_images` bucket
3. Click **New Policy** for each policy below
4. Choose **Custom** policy type
5. Paste each SQL policy and save

#### Policy 1: Public Read Access
```sql
CREATE POLICY "Public profile images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_images');
```

#### Policy 2: Authenticated Upload
```sql
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile_images');
```

#### Policy 3: Authenticated Update
```sql
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile_images')
WITH CHECK (bucket_id = 'profile_images');
```

#### Policy 4: Authenticated Delete
```sql
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile_images');
```

#### Policy 5: Service Role Management (CRITICAL)
```sql
CREATE POLICY "Service role can manage all profile images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'profile_images')
WITH CHECK (bucket_id = 'profile_images');
```

**Note:** Policy 5 is critical for the API route to work correctly with the service role client.

## Step 3: Verify Policies Are Active

After applying the policies, verify they're active:

1. Go to **Storage** → **Policies** in Supabase Dashboard
2. Select the `profile_images` bucket
3. You should see all 5 policies listed and enabled

## Step 4: Verify Setup

To verify your storage bucket is set up correctly:

1. Log in to your application
2. Navigate to the Account page (Admin or Employee)
3. Try uploading an avatar image
4. Verify the image appears correctly
5. Check the Supabase Storage bucket to see the uploaded file

## Storage Structure

The avatars will be stored directly in the bucket with the following naming convention:
```
profile_images/
  ├── {userId}-{timestamp}.jpg
  ├── {userId}-{timestamp}.png
  └── {userId}-{timestamp}.webp
```

## Troubleshooting

### Upload Fails with "new row violates row-level security policy"

**Solution**: This error occurs when the API route doesn't have proper authentication context. The upload API route (`/api/upload-avatar`) now uses the Supabase service role client (`supabaseAdmin`) which bypasses RLS policies, so this issue should be resolved.

### Upload Fails with "Permission Denied"

**Solution**: Make sure you've applied all the storage policies listed above, especially the INSERT policy for authenticated users. Note: The API route uses the service role client which bypasses these policies.

### Images Not Displaying

**Solution**: 
1. Check if the bucket is set to **Public**
2. Verify the SELECT policy is in place for public access
3. Check browser console for CORS errors

### Old Images Not Deleted

**Solution**: The system automatically deletes old avatars before uploading new ones. Verify the DELETE policy is properly configured.

### File Size Error

**Solution**: Images must be under 5MB. Compress images before uploading or adjust the file size limit in the bucket settings.

## Environment Variables

Make sure these are set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads)

## Features Implemented

✅ Avatar upload component with drag-and-drop support  
✅ Image preview before upload  
✅ File type validation (JPEG, PNG, WebP)  
✅ File size validation (max 5MB)  
✅ Automatic deletion of old avatars  
✅ Public URL generation for avatars  
✅ Dark mode support  
✅ Loading states and error handling  
✅ Integrated with both Admin and Employee account pages  

## Support

If you encounter any issues, please check:
1. Supabase Dashboard → Storage → Policies
2. Browser console for error messages
3. Network tab for failed requests
4. Supabase logs in the Dashboard
