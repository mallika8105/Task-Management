# Apply Task In Progress Notification Fix

## Quick Fix Guide

Follow these steps to fix the notification issue where admins don't receive notifications when employees mark tasks as "In Progress".

### Step 1: Access Supabase SQL Editor

1. Open your Supabase Dashboard at https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Migration

Copy the following SQL and paste it into the SQL Editor:

```sql
-- Fix task_in_progress notification type
-- This ensures the CHECK constraint properly includes task_in_progress

-- Drop the old constraint if it exists
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the correct constraint with all notification types including task_in_progress
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'task_assigned', 
  'task_completed', 
  'task_in_progress',
  'comment_added', 
  'task_updated', 
  'message_sent', 
  'pr_raised',
  'user_signup',
  'user_login'
));

-- Also drop any enum type if it exists (cleanup from previous migration attempts)
DROP TYPE IF EXISTS notification_type CASCADE;
```

### Step 3: Execute the SQL

Click the "Run" button to execute the migration.

### Step 4: Verify the Fix

1. Log in as an **employee**
2. Navigate to "My Tasks"
3. Open any task assigned to you
4. Change the status from "Not Picked" to "In Progress"
5. Click "Update Status"
6. Log out

7. Log in as an **admin**
8. Check the notification bell icon
9. You should see a notification: "Task Started - Task '[task name]' has been marked as in progress"

### Expected Result

✅ Admin receives notification when employee changes task status to "In Progress"
✅ Admin receives notification when employee changes task status to "Completed" (already working)
✅ Admin receives notification when employee adds comments
✅ All notification types work properly

## What This Fix Does

The migration:
- Updates the database CHECK constraint to properly include 'task_in_progress' as a valid notification type
- Cleans up any incorrect enum types from previous migration attempts
- Ensures all notification types are properly configured

## Troubleshooting

If you still don't see notifications after applying the fix:

1. **Check browser console** for any JavaScript errors
2. **Verify the migration ran successfully** in the Supabase SQL Editor
3. **Check the notifications table** exists with the correct constraint:
   ```sql
   SELECT conname, pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conrelid = 'notifications'::regclass AND conname = 'notifications_type_check';
   ```
4. **Clear browser cache** and try again

## Need More Help?

Refer to `TASK_IN_PROGRESS_NOTIFICATION_FIX.md` for detailed technical information about the issue and solution.
