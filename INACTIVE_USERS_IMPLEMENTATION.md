# Inactive Users Implementation Guide

## Overview
This implementation adds support for soft-deleting users (marking them as inactive) instead of permanently deleting them from the database. This ensures that tasks assigned to deleted users still show the user's name with an "(inactive)" label.

## Changes Made

### 1. Database Schema Changes
- **Migration File**: `supabase/migrations/add_user_status.sql`
- Added a `status` column to the `users` table with values: `active` or `inactive`
- Set default value to `active` for all existing users
- Added an index on the `status` column for better query performance

### 2. API Changes
- **File**: `app/api/admin/delete-user/route.ts`
- Modified the delete user endpoint to perform soft deletes
- Instead of deleting from `public.users` table, it now updates the `status` to `inactive`
- User is still deleted from Supabase Auth for security

### 3. Frontend Changes

#### Admin Tasks Page (`app/admin/tasks/page.tsx`)
- Updated to fetch user `status` along with other user details
- Modified the "Assigned To" column to display "(inactive)" label for inactive users
- Example: "John Doe (inactive)"

#### Task Detail Page (`app/admin/tasks/[id]/page.tsx`)
- Updated to fetch and display user `status`
- Shows "(inactive)" label next to inactive users in:
  - The "Assigned To" section in the sidebar
  - The user dropdown when reassigning tasks

## Migration Instructions

### Step 1: Run the Database Migration

You need to run the SQL migration on your Supabase database. You have two options:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the content from `supabase/migrations/add_user_status.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the migration

#### Option B: Using Supabase CLI
If you have Supabase CLI installed:
```bash
# Apply the migration
supabase db push

# Or run the specific migration file
supabase db execute --file supabase/migrations/add_user_status.sql
```

### Step 2: Verify the Migration

After running the migration, verify it was successful:

1. Go to Supabase Dashboard → **Table Editor**
2. Select the `users` table
3. Confirm that a new `status` column exists
4. Check that all existing users have `status = 'active'`

### Step 3: Test the Implementation

1. **Delete a User**:
   - Go to the Admin Users page
   - Delete a test user
   - The user should be marked as inactive (not deleted from the database)

2. **View Tasks**:
   - Go to the Admin Tasks page
   - Find any tasks assigned to the deleted user
   - The "Assigned To" column should show: "User Name (inactive)"

3. **Task Details**:
   - Click on a task assigned to an inactive user
   - Verify that the task detail page shows "(inactive)" next to the user's name

## Database Schema

### Before Migration
```sql
users (
  id uuid PRIMARY KEY,
  full_name text,
  email text UNIQUE,
  role text,
  manager text,
  team text,
  profile_image text,
  created_at timestamp
)
```

### After Migration
```sql
users (
  id uuid PRIMARY KEY,
  full_name text,
  email text UNIQUE,
  role text,
  manager text,
  team text,
  profile_image text,
  created_at timestamp,
  status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active'  -- NEW
)
```

## Benefits

1. **Data Integrity**: Task history is preserved even when users are removed
2. **Audit Trail**: You can see who was assigned to tasks, even if they're no longer active
3. **Better UX**: Admins can clearly identify inactive users in the system
4. **Reversible**: If needed, users can be reactivated by changing status back to 'active'

## Future Enhancements

Consider these potential improvements:
- Add a filter to hide/show inactive users in the admin panel
- Add a "Deleted on" timestamp column to track when users were deactivated
- Prevent assigning new tasks to inactive users
- Add a "Reactivate User" feature for admins
- Show deleted_at date alongside the inactive label

## Troubleshooting

### Issue: Migration fails
**Solution**: Check if the `status` column already exists. If it does, you can skip this migration.

### Issue: Old deleted users don't show up
**Solution**: This implementation only affects users deleted after running the migration. Previously deleted users are permanently removed and cannot be recovered.

### Issue: Status column shows NULL
**Solution**: Run this SQL to update null values:
```sql
UPDATE users SET status = 'active' WHERE status IS NULL;
```

## Rollback (If Needed)

If you need to rollback this change:
```sql
-- Remove the status column
ALTER TABLE users DROP COLUMN IF EXISTS status;

-- Drop the index
DROP INDEX IF EXISTS idx_users_status;
```

**Warning**: Rolling back will remove the soft-delete functionality and you'll lose the ability to track inactive users.
