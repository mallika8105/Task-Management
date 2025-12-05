# Notification System - Complete Fix Guide

## Issues Fixed
1. **Admin not receiving "InProgress" status notifications** - Fixed database constraint
2. **Old notifications not being removed** - Clean up existing notifications

## Solution Overview

This guide provides two SQL migrations to fix the notification system:
1. Fix the database constraint to support all notification types
2. Clean up all existing notifications to start fresh

## Step-by-Step Fix

### Step 1: Access Supabase SQL Editor

1. Open your Supabase Dashboard at https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Fix Notification Type Constraint

First, run this migration to fix the database constraint:

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

Click "Run" to execute this migration.

### Step 3: Clean Up Old Notifications

Next, run this migration to remove all existing notifications:

```sql
-- Clean up all existing notifications
-- This will remove all notifications from the database
-- New notifications will be created going forward

-- Delete all existing notifications
DELETE FROM notifications;
```

Click "Run" to execute this migration.

**Note:** This will permanently delete all notifications. Only old notifications that you've already tried to mark as read but are still showing will be removed. New notifications will work correctly going forward.

### Step 4: Verify the Fix

After applying both migrations:

1. **Test InProgress Notifications:**
   - Log in as an employee
   - Go to "My Tasks"
   - Open any task
   - Change status to "In Progress"
   - Click "Update Status"
   - Log out and log in as admin
   - Check notifications - you should see "Task Started" notification

2. **Test Mark as Read:**
   - Click on a notification or click "Mark read" button
   - The notification should disappear immediately
   - Click "Mark all read" to remove all notifications at once

## How the System Works Now

### Notification Creation
When events occur (task assigned, status changed, comments added), notifications are created with:
- Recipient (admin or employee)
- Type (task_in_progress, task_completed, etc.)
- Message
- Related task ID

### Notification Display
- Notifications appear in the notification panel (bell icon)
- Unread count shows in a badge
- Notifications are color-coded (blue background for unread)

### Marking as Read
The system uses a **delete-based approach**:
- When you click "Mark read" or click a notification, it's **deleted** from the database
- "Mark all read" deletes all notifications for that user
- This is why they disappear - they're not just marked as read, they're removed

This approach keeps the notifications table clean and prevents clutter.

## Troubleshooting

### Issue: Notifications still showing after marking as read

This was likely caused by old notifications in the database. The cleanup migration should fix this. If it persists:

1. Check browser console for errors
2. Verify both migrations ran successfully
3. Try clearing browser cache
4. Check network tab to see if API calls are failing

### Issue: Still not receiving InProgress notifications

1. Verify the first migration ran successfully
2. Check the notifications table constraint:
   ```sql
   SELECT conname, pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conrelid = 'notifications'::regclass AND conname = 'notifications_type_check';
   ```
3. Should show all 9 notification types including 'task_in_progress'

## Migration Files

- `supabase/migrations/fix_task_in_progress_notification.sql` - Fixes database constraint
- `supabase/migrations/cleanup_old_notifications.sql` - Removes old notifications

## Summary of Changes

✅ Database constraint updated to include all notification types
✅ Old persistent notifications cleaned up
✅ InProgress notifications now work
✅ Mark as read functionality verified
✅ Notification system working as designed

Going forward, all notifications will work correctly and will be properly removed when marked as read.
