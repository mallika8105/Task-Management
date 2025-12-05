# Task Status Notifications - Setup Guide

## Problem
Admin is not receiving notifications when users update task status (In Progress or Completed).

## Root Cause
The database notification types `task_completed` and `task_in_progress` need to be added to the `notification_type` enum.

## Solution

### Step 1: Run SQL Migration in Supabase

1. Go to https://supabase.com
2. Login and select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the following SQL:

```sql
-- Add notification types for all task status changes
-- The notifications table uses a CHECK constraint, not an enum
-- This migration updates the CHECK constraint to include new notification types

-- Drop the old constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new constraint with all notification types
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
```

6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

### Step 2: Verify the Migration

Run this query to verify the constraint was updated:

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'notifications_type_check';
```

You should see the CHECK constraint listing all notification types including `task_completed` and `task_in_progress`.

### Step 3: Test Notifications

#### Test "In Progress" Notification:
1. **Login as a regular user** (not admin)
2. Go to **My Tasks**
3. Open any task
4. Change status to **"In Progress"**
5. Click **"Update Status"**
6. **Login as admin**
7. Check the notification panel - you should see:
   - Icon: 🚀
   - Title: "Task Started"
   - Message: Task "[task name]" has been marked as in progress

#### Test "Completed" Notification:
1. **Login as a regular user**
2. Go to **My Tasks**
3. Open any task
4. Change status to **"Completed"**
5. Click **"Update Status"**
6. **Login as admin**
7. Check the notification panel - you should see:
   - Icon: ✅
   - Title: "Task Completed"
   - Message: Task "[task name]" has been marked as completed

## How It Works

The code is already implemented in `app/(employee)/mytasks/[id]/page.tsx`:

```typescript
// When user updates status
if (status === "completed") {
  await notifyTaskCompletion(
    task.id,
    task.created_by,  // admin ID
    user.id,          // user who completed it
    task.title
  );
} else if (status === "in_progress") {
  await notifyTaskInProgress(
    task.id,
    task.created_by,  // admin ID
    user.id,          // user who started it
    task.title
  );
}
```

## All Status Change Notifications

After applying this migration, admin will receive notifications for:

| Status Change | Notification Type | Icon | Title | Message |
|--------------|------------------|------|-------|---------|
| **Not Picked** | `task_updated` | 🔄 | Task Updated | Task "[name]" has been updated: status changed to Not Picked |
| **In Progress** | `task_in_progress` | 🚀 | Task Started | Task "[name]" has been marked as in progress |
| **Completed** | `task_completed` | ✅ | Task Completed | Task "[name]" has been marked as completed |

## Troubleshooting

### If notifications still don't appear:

1. **Check browser console** for errors (F12 → Console tab)
2. **Verify the migration ran successfully** by running the verification query above
3. **Check if the admin user exists** in the tasks table as `created_by`
4. **Refresh the admin page** after user updates task status
5. **Check Supabase logs** in Dashboard → Logs for any errors

## Files Involved

- `supabase/migrations/add_all_task_status_notification_types.sql` - Database migration
- `lib/supabase/notification-helpers.ts` - Notification helper functions
- `app/(employee)/mytasks/[id]/page.tsx` - Task status update implementation
- `app/components/NotificationPanel.tsx` - Notification display

## Summary

✅ **What was done:**
- Created comprehensive migration for both `task_completed` and `task_in_progress` types
- Code implementation already exists and is ready to use
- Just need to run the SQL migration in Supabase

✅ **What happens after migration:**
- Admin receives real-time notifications when users change task status
- Notifications appear in the notification panel with appropriate icons
- Works for both "In Progress" and "Completed" status changes
