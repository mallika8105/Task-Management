# Apply User Signup Notification Migration

## Quick Guide to Apply the Database Migration

Since the Supabase CLI is not available locally, you need to apply the migration manually through the Supabase Dashboard.

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Copy and Paste the Migration SQL**
   
   Copy this SQL and paste it into the SQL editor:

   ```sql
   -- Add 'user_signup' notification type to the existing CHECK constraint
   ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

   ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
     CHECK (type IN ('task_assigned', 'task_completed', 'comment_added', 'task_updated', 'message_sent', 'pr_raised', 'user_signup'));
   ```

4. **Run the Migration**
   - Click the "Run" button or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - You should see "Success. No rows returned" message

5. **Verify the Migration**
   
   Run this query to verify the constraint was updated:
   
   ```sql
   SELECT con.conname, pg_get_constraintdef(con.oid)
   FROM pg_constraint con
   INNER JOIN pg_class rel ON rel.oid = con.conrelid
   WHERE rel.relname = 'notifications' AND con.conname = 'notifications_type_check';
   ```
   
   You should see `user_signup` in the constraint definition.

6. **Test the Implementation**
   - Restart your development server if it's running
   - As an admin, send an invitation to a test user
   - Have the test user accept the invitation and sign up
   - Check your admin notifications panel - you should see a "New User Signup" notification

### Alternative: Using the Migration File

If you prefer to use the migration file directly:

1. Go to SQL Editor in Supabase Dashboard
2. Click "New query"
3. Copy the contents of `supabase/migrations/add_user_signup_notification_type.sql`
4. Paste and run

## Troubleshooting

### If the migration fails:

**Error: constraint "notifications_type_check" does not exist**
- This is normal if the constraint has a different name
- The `DROP CONSTRAINT IF EXISTS` handles this, so the migration should still work

**Error: constraint already exists**
- Check if the migration was already applied
- Run the verification query above to check

**Error: permission denied**
- Make sure you're logged into the correct Supabase project
- Ensure your account has admin access to the database

## What This Migration Does

This migration updates the `notifications` table to support a new notification type called `user_signup`. When a user accepts an invitation and signs up, all admins will receive a notification.

### Before:
```sql
CHECK (type IN ('task_assigned', 'task_completed', 'comment_added', 
                'task_updated', 'message_sent', 'pr_raised'))
```

### After:
```sql
CHECK (type IN ('task_assigned', 'task_completed', 'comment_added', 
                'task_updated', 'message_sent', 'pr_raised', 'user_signup'))
```

## Next Steps

After applying the migration:

1. ✅ The database now supports user signup notifications
2. ✅ The code changes are already in place
3. ✅ Restart your development server
4. ✅ Test the feature by having a new user sign up via invitation

For complete details about this fix, see `USER_SIGNUP_NOTIFICATION_FIX.md`.
