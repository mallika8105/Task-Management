# User Deletion Fix - Apply Migration V2

## Problem
When deleting a user, the system was failing with "Database error deleting user" because:

1. The `users` table has `ON DELETE CASCADE` constraint in the master schema
2. When deleting from `auth.users`, it CASCADE deletes the `public.users` record
3. Then the API tries to UPDATE the already-deleted user record to set `status='inactive'`, which fails

## Solution
The migration `fix_user_deletion_cascade_v2.sql` fixes this by:

1. Removing the CASCADE DELETE constraint
2. Adding `ON DELETE NO ACTION` constraint instead
3. Ensuring the `status` column exists
4. The API now marks user as inactive FIRST, then deletes from auth

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/fix_user_deletion_cascade_v2.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI
```bash
# Make sure you're in the project directory
cd "c:\Users\91810\OneDrive\Desktop\Projects\Task Management System"

# Apply the migration
npx supabase db push
```

## After Migration
Once applied, the user deletion will work as follows:

1. **Admin deletes a user** from the Users page
2. **API marks user as inactive** in `public.users` table (preserving the record)
3. **API deletes from auth.users** (authentication record removed, but public.users remains)
4. **Tasks assigned to deleted users** will still show their name with "(inactive)" label
5. **User cannot log in** anymore (auth record deleted)
6. **Historical data is preserved** for task tracking and audit purposes

## Verification
After applying the migration, test by:
1. Creating a test user
2. Assigning them a task
3. Deleting the user
4. Check that the task still shows the user's name with "(inactive)"
5. Verify no database errors occur

## Migration Content
```sql
-- Migration to fix user deletion cascade issue (V2)
-- This ensures user records are preserved when auth user is deleted
-- so tasks can still show who they were assigned to

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Add it back without CASCADE DELETE
-- This means deleting from auth.users won't delete from public.users
ALTER TABLE IF EXISTS users 
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE NO ACTION;

-- Ensure status column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active';
  END IF;
END $$;

-- Note: The delete-user API will handle soft deletion by marking status as 'inactive'
-- This preserves user records for historical task assignment tracking
