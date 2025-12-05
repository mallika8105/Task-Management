# Duplicate Login Notification Fix

## Problem
Users were seeing duplicate "User Login" notifications in the notification panel. Each time a user logged in, a new notification was created, resulting in multiple notifications for the same user across different login sessions.

## Root Cause
The login notification system was creating a new notification every time a user logged in, without checking if a recent notification already existed. This resulted in duplicate notifications accumulating over time.

## Solution Implemented

### 1. Updated Notification Helper (`lib/supabase/notification-helpers.ts`)

Modified the `notifyUserLogin` function to:
- **Check for recent duplicates**: Before creating a notification, check if a login notification from the same user already exists within the last hour
- **Skip if duplicate exists**: If a recent notification is found, skip creating a new one
- **Clean up old notifications**: Automatically delete login notifications older than 1 hour from the same user
- **Error handling**: Added proper error handling and logging

Key changes:
```typescript
export async function notifyUserLogin(
  adminId: string,
  userId: string,
  userName: string,
  userEmail: string
) {
  try {
    // Check for existing login notification within the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("id")
      .eq("recipient_id", adminId)
      .eq("sender_id", userId)
      .eq("type", "user_login")
      .gte("created_at", oneHourAgo);

    // Skip if recent notification exists
    if (existingNotifications && existingNotifications.length > 0) {
      console.log(`Skipping duplicate login notification for user ${userId}`);
      return { data: null, error: null };
    }

    // Delete old notifications (older than 1 hour)
    await supabase
      .from("notifications")
      .delete()
      .eq("recipient_id", adminId)
      .eq("sender_id", userId)
      .eq("type", "user_login")
      .lt("created_at", oneHourAgo);

    // Create new notification
    return createNotification({...});
  } catch (error) {
    console.error("Error in notifyUserLogin:", error);
    return { data: null, error };
  }
}
```

### 2. Created Cleanup Migration

**File**: `supabase/migrations/cleanup_duplicate_login_notifications.sql`

This migration:
- Removes all duplicate login notifications
- Keeps only the most recent notification for each user-admin combination
- Uses window functions to efficiently identify and delete duplicates

```sql
DELETE FROM notifications
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY sender_id, recipient_id, type 
        ORDER BY created_at DESC
      ) as rn
    FROM notifications
    WHERE type = 'user_login'
  ) AS ranked
  WHERE rn > 1
);
```

## Benefits

1. **No more duplicates**: Users will only see one login notification per user within a 1-hour window
2. **Automatic cleanup**: Old notifications are automatically removed after 1 hour
3. **Better user experience**: Notification panel stays clean and organized
4. **Performance**: Reduces database clutter and improves query performance

## Deduplication Window

The 1-hour deduplication window means:
- If a user logs in multiple times within 1 hour, only the first login notification is kept
- After 1 hour, the old notification is automatically deleted
- A new notification can be created for subsequent logins after the 1-hour window

This prevents notification spam while still keeping admins informed about user activity.

## Files Modified

1. `lib/supabase/notification-helpers.ts` - Updated `notifyUserLogin` function
2. `supabase/migrations/cleanup_duplicate_login_notifications.sql` - New migration to clean up existing duplicates

## Next Steps

1. Apply the cleanup migration to remove existing duplicate notifications
2. The updated code will prevent future duplicates automatically
3. Monitor to ensure no new duplicates appear

## Testing

After applying the fix:
1. Login as a non-admin user
2. Check admin notification panel - should see only one login notification
3. Login again within 1 hour - should NOT see a new notification
4. Wait 1 hour and login again - should see a new notification (old one deleted)
