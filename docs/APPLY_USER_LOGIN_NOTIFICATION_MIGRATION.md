# Apply User Login Notification Migration

## Overview
This guide provides step-by-step instructions to apply the user login notification migration to your Supabase database.

## Migration File
- **File:** `supabase/migrations/add_user_login_notification_type.sql`
- **Purpose:** Adds `user_login` notification type to the notifications table constraint

## Prerequisites
- Access to Supabase Dashboard or Supabase CLI
- Database connection credentials (if using SQL editor)

## Option 1: Using Supabase Dashboard (Recommended)

### Steps:

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration SQL**
   - Open `supabase/migrations/add_user_login_notification_type.sql`
   - Copy the entire contents:
   ```sql
   -- Add 'user_login' notification type to the existing CHECK constraint
   ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

   ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
     CHECK (type IN ('task_assigned', 'task_completed', 'comment_added', 'task_updated', 'message_sent', 'pr_raised', 'user_signup', 'user_login'));
   ```

4. **Execute the Migration**
   - Paste the SQL into the SQL editor
   - Click "Run" or press Ctrl+Enter (Cmd+Enter on Mac)

5. **Verify Success**
   - You should see: "Success. No rows returned"
   - The constraint has been updated successfully

## Option 2: Using Supabase CLI

### Steps:

1. **Ensure Supabase CLI is installed**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project** (if not already linked)
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Apply pending migrations**
   ```bash
   supabase db push
   ```

   Or apply all migrations:
   ```bash
   supabase migration up
   ```

5. **Verify the migration**
   ```bash
   supabase db diff
   ```
   - Should show no differences if migration was successful

## Option 3: Manual SQL Execution

### If you have direct database access:

1. **Connect to your PostgreSQL database**
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres"
   ```

2. **Execute the migration**
   ```sql
   ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

   ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
     CHECK (type IN ('task_assigned', 'task_completed', 'comment_added', 'task_updated', 'message_sent', 'pr_raised', 'user_signup', 'user_login'));
   ```

3. **Verify the constraint**
   ```sql
   SELECT constraint_name, check_clause 
   FROM information_schema.check_constraints 
   WHERE constraint_name = 'notifications_type_check';
   ```

## Verification Steps

After applying the migration, verify it worked correctly:

### 1. Check Constraint Exists
```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'notifications_type_check';
```

Expected result should include `user_login` in the check clause.

### 2. Test Notification Creation
Try creating a test notification with the new type:

```sql
INSERT INTO notifications (
  recipient_id,
  sender_id,
  type,
  title,
  message
) VALUES (
  'your-admin-user-id',
  'your-test-user-id',
  'user_login',
  'Test Login Notification',
  'This is a test login notification'
);
```

If successful, the migration is working correctly.

### 3. Clean Up Test Data (Optional)
```sql
DELETE FROM notifications 
WHERE title = 'Test Login Notification';
```

## Troubleshooting

### Error: "constraint does not exist"
- This is normal if the constraint name is different
- The migration uses `DROP CONSTRAINT IF EXISTS` to handle this safely

### Error: "duplicate key value violates unique constraint"
- This should not occur with this migration
- If it does, check if the migration was already applied

### Error: "permission denied"
- Ensure you're using the correct credentials
- You may need superuser or database owner permissions

### Migration already applied
- If you see "constraint already exists" or similar
- Check if `user_login` is already in the constraint:
  ```sql
  SELECT check_clause 
  FROM information_schema.check_constraints 
  WHERE constraint_name = 'notifications_type_check';
  ```

## Next Steps

After successfully applying the migration:

1. ✅ The database is ready to accept `user_login` notifications
2. ✅ Test the login notification feature:
   - Log in as a non-admin user (employee)
   - Check admin dashboard notifications
   - Verify admins receive login notifications

3. ✅ Monitor the application logs for any errors

## Rollback (If Needed)

To rollback this migration:

```sql
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('task_assigned', 'task_completed', 'comment_added', 'task_updated', 'message_sent', 'pr_raised', 'user_signup'));
```

**Note:** This removes the `user_login` type from the allowed values. Any existing `user_login` notifications will cause errors if this rollback is applied.

## Related Documentation

- [USER_LOGIN_NOTIFICATION_IMPLEMENTATION.md](./USER_LOGIN_NOTIFICATION_IMPLEMENTATION.md) - Full implementation details
- [NOTIFICATION_SYSTEM_GUIDE.md](./NOTIFICATION_SYSTEM_GUIDE.md) - Notification system overview

## Support

If you encounter any issues:
1. Check the Supabase Dashboard logs
2. Review the console for error messages
3. Verify all prerequisites are met
4. Ensure the migration file exists and is not corrupted
