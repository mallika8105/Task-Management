# Inactive User Sign-Out Issue

## Issue Description
Users are being automatically signed out with the message "User is inactive, signing them out" appearing in the console.

## Root Cause
This is **NOT** related to the CSP violation error. This is a separate feature in the application where the `getCurrentUser()` function in `lib/supabase/auth-helpers.ts` checks if a user's status is set to `'inactive'` in the database and automatically signs them out.

### The Code (from lib/supabase/auth-helpers.ts):
```typescript
// Check if user is inactive - deny access if so
if (userProfile.status === 'inactive') {
  console.log("User is inactive, signing them out");
  // Sign out the user
  await supabase.auth.signOut();
  return null;
}
```

## Why This Happens

A user's status can become 'inactive' in several scenarios:

1. **Admin soft-deleted the user**: When an admin deletes a user through the admin panel, the user is marked as inactive instead of being permanently deleted (this preserves historical data like task assignments)

2. **Database inconsistency**: If the `status` column was not properly initialized during user creation

3. **Testing/Development activities**: Manual database changes during development

## How to Fix

### Option 1: Reactivate a Specific User

1. Go to your Supabase SQL Editor
2. Run this query to check the user's current status:
   ```sql
   SELECT id, email, full_name, role, status, created_at
   FROM public.users
   WHERE email = 'user@example.com';
   ```

3. If the status is 'inactive', reactivate the user:
   ```sql
   UPDATE public.users 
   SET status = 'active' 
   WHERE email = 'user@example.com';
   ```

### Option 2: Reactivate All Inactive Users

If you want to reactivate all inactive users (use with caution):

```sql
UPDATE public.users 
SET status = 'active' 
WHERE status = 'inactive';
```

### Option 3: Use the Provided SQL Script

A SQL script has been created at `fix_inactive_user_status.sql` that includes:
- A query to check all users and their statuses
- Commands to reactivate specific or all inactive users

## Prevention

To prevent users from being incorrectly marked as inactive:

1. **Ensure migrations are applied**: Make sure the `add_user_status.sql` migration has been applied, which sets the default status to 'active'

2. **Check user creation trigger**: The `fix_user_creation_trigger.sql` migration ensures that new users are created with status='active'

3. **Verify new user creation**: After creating a new user, verify their status in the database:
   ```sql
   SELECT email, status FROM public.users ORDER BY created_at DESC LIMIT 5;
   ```

## Related Features

The inactive status feature is part of the "soft delete" functionality:
- When admins delete users, they're marked as inactive rather than being permanently deleted
- This preserves historical data (task assignments, comments, etc.)
- Inactive users cannot log in
- Inactive users are shown with an "(inactive)" label in task assignments

For more information, see: `INACTIVE_USERS_IMPLEMENTATION.md`

## Note on CSP Violation

This inactive user issue is **completely separate** from the Content Security Policy (CSP) violation error. For information about the CSP fix, see `CSP_VIOLATION_FIX.md`.
