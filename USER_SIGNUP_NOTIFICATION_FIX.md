# User Signup Notification Fix

## Issue
Admins were not receiving notifications when users accepted invitations and signed up.

## Solution
Added a new notification system that alerts all admins when a new user completes the signup process via invitation.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/add_user_signup_notification_type.sql`

Added a new notification type `user_signup` to the notifications table:

```sql
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('task_assigned', 'task_completed', 'comment_added', 'task_updated', 'message_sent', 'pr_raised', 'user_signup'));
```

### 2. Notification Helper Function
**File:** `lib/supabase/notification-helpers.ts`

- Updated the `Notification` interface to include the new `user_signup` type
- Added a new helper function `notifyUserSignup()` that creates notifications for admins when a new user signs up

```typescript
export async function notifyUserSignup(
  adminId: string,
  newUserId: string,
  newUserName: string,
  newUserEmail: string
)
```

### 3. Signup Route Enhancement
**File:** `app/api/auth/signup-invited/route.ts`

Modified the signup process to:
1. Fetch all admin users from the database
2. Create a notification for each admin when a new user successfully signs up
3. Handle notification creation errors gracefully without failing the signup process

## How to Apply

### Step 1: Apply Database Migration

You need to apply the migration to add the new notification type to your database.

**Option A: Using Supabase CLI (if running locally)**
```bash
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/add_user_signup_notification_type.sql`
4. Run the SQL query

**Option C: Direct SQL (if you have database access)**
```sql
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('task_assigned', 'task_completed', 'comment_added', 'task_updated', 'message_sent', 'pr_raised', 'user_signup'));
```

### Step 2: Restart Development Server

After applying the migration, restart your development server:

```bash
npm run dev
```

## Testing

To test the fix:

1. As an admin, send an invitation to a new user
2. The new user receives the invitation email
3. The new user accepts the invitation and completes the signup
4. Admin should now receive a notification: "New User Signup - [Name] ([Email]) has accepted the invitation and signed up"
5. Check the admin panel's notification icon to see the new notification

## Notification Details

- **Type:** `user_signup`
- **Title:** "New User Signup"
- **Message:** "{userName} ({userEmail}) has accepted the invitation and signed up"
- **Recipients:** All users with the `admin` role
- **Sender:** The newly signed-up user

## Error Handling

The notification creation is wrapped in a try-catch block to ensure that:
- If notification creation fails, the user signup still completes successfully
- Errors are logged to the console for debugging
- The system gracefully handles cases where no admins exist

## Files Modified

1. `supabase/migrations/add_user_signup_notification_type.sql` (new)
2. `lib/supabase/notification-helpers.ts` (modified)
3. `app/api/auth/signup-invited/route.ts` (modified)

## Rollback Instructions

If you need to rollback this change:

1. Remove the `user_signup` type from the notifications table:
```sql
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('task_assigned', 'task_completed', 'comment_added', 'task_updated', 'message_sent', 'pr_raised'));
```

2. Revert the code changes in `lib/supabase/notification-helpers.ts` and `app/api/auth/signup-invited/route.ts`
