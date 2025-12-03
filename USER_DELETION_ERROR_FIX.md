# User Deletion Error Fix - December 3, 2025

## Error Description

When attempting to delete/revoke user invitations from the Admin Users page, a 500 Internal Server Error occurred:

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Client: Delete user API responded with an error status: 500 
{"error":"Database error deleting user","details":"Database error deleting user"}
Error revoking invitation or deleting user: Error: Database error deleting user
```

## Root Cause Analysis

The error was caused by a **foreign key constraint violation** in the database:

1. **Database Schema Constraint:**
   - The `public.users` table has: `id uuid REFERENCES auth.users(id) ON DELETE NO ACTION`
   - This constraint **prevents** deletion from `auth.users` if the user record still exists in `public.users`

2. **Previous API Logic (Incorrect):**
   ```
   1. Mark user as inactive in public.users ✓
   2. Delete user from auth.users ✗ (BLOCKED by constraint)
   ```

3. **Why the Constraint Exists:**
   - `ON DELETE NO ACTION` preserves user records for **historical data integrity**
   - Task assignments, comments, and audit trails reference user IDs
   - Deleting from `auth.users` would orphan these references

## Solution Implemented

### Changed Approach: Soft Deletion Only

Instead of attempting to delete from `auth.users`, we now:

1. **Mark user as inactive** in `public.users` (soft delete)
2. **Sign out user** from all sessions (revoke access)
3. **Preserve auth record** for data integrity

### Code Changes

#### 1. Updated API Route (`app/api/admin/delete-user/route.ts`)

**Before:**
```typescript
// Mark as inactive
await adminSupabase.from("users").update({ status: 'inactive' }).eq("email", email);

// Delete from auth (THIS FAILED)
await adminSupabase.auth.admin.deleteUser(userToDelete.id);
```

**After:**
```typescript
// Mark as inactive
await adminSupabase.from("users").update({ status: 'inactive' }).eq("email", email);

// Sign out from all sessions (revoke access)
await adminSupabase.auth.admin.signOut(userToDelete.id, 'global');
```

#### 2. Enhanced Auth Helper (`lib/supabase/auth-helpers.ts`)

Added status check in `getCurrentUser()` to prevent inactive users from accessing the system:

```typescript
// Fetch user profile including status
const { data: userProfile } = await supabase
  .from('users')
  .select('role, profile_image, status')
  .eq('id', user.id)
  .single();

// Block access for inactive users
if (userProfile.status === 'inactive') {
  console.log("User is inactive, signing them out");
  await supabase.auth.signOut();
  return null;
}
```

## How It Works Now

### User Deletion Flow

1. **Admin clicks "Delete" or "Revoke"** on Users page
2. **Invitation deleted** from `invitations` table
3. **API marks user as inactive:**
   - Updates `status = 'inactive'` in `public.users`
   - Signs out user from all active sessions
4. **User record preserved:**
   - Remains in both `auth.users` and `public.users`
   - All task assignments and history remain intact
5. **Access blocked:**
   - User cannot log in (status check in `getCurrentUser`)
   - Any existing sessions are terminated

### Data Integrity Benefits

✅ **Historical data preserved** - Task assignments remain valid  
✅ **Audit trails intact** - Created_by/assigned_to references work  
✅ **No orphaned records** - Foreign key relationships maintained  
✅ **Reversible** - User can be reactivated by changing status to 'active'  

## Testing the Fix

To verify the fix works:

1. **Test User Deletion:**
   - Go to Admin → Users page
   - Click "Delete" or "Revoke" on a user
   - Should succeed without 500 error
   - User should disappear from active users list

2. **Test Access Blocking:**
   - Try logging in as the deleted user
   - Should be immediately signed out
   - Access should be denied

3. **Test Data Integrity:**
   - Check tasks created/assigned to deleted user
   - User references should still be valid
   - No broken foreign keys

## Files Modified

1. `app/api/admin/delete-user/route.ts` - Changed deletion logic
2. `lib/supabase/auth-helpers.ts` - Added inactive user check

## Notes

- User records are **never physically deleted** from the database
- This is a **soft deletion** approach using the `status` field
- To permanently delete a user, you would need to manually remove the `ON DELETE NO ACTION` constraint (not recommended)
- Inactive users are filtered out in the admin users page display
