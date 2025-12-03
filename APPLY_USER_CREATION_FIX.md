# Fix for Users Not Showing in User Management Section

## Problem
Users who sign up through invitations are showing only in the "Pending Invitations" section with "✓ Signed Up" status, but NOT appearing in the "User Management" section above.

## Root Cause
The database trigger `handle_new_user()` that automatically creates users in `public.users` when they're created in `auth.users` was failing silently when there was an email conflict. This happened because:

1. The `users` table has a UNIQUE constraint on the `email` column
2. If a user with that email already existed (from a previous failed attempt), the trigger would fail on the email conflict
3. The trigger had `ON CONFLICT (id) DO NOTHING` which only handled ID conflicts, not email conflicts
4. This left users in `auth.users` but not in `public.users`, causing them to not appear in the User Management list

## Solution
Updated the trigger to:
1. Delete any existing user with the same email but different ID (cleanup orphaned records)
2. Insert or update the user properly with conflict handling on ID
3. Remove redundant manual insert code from the signup route

## Files Changed
1. **supabase/migrations/fix_user_creation_trigger.sql** - New migration file with the fixed trigger
2. **app/api/auth/signup-invited/route.ts** - Removed redundant manual insert code

## How to Apply

### Step 1: Apply the Migration to Supabase

You need to run the SQL migration on your Supabase database:

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/fix_user_creation_trigger.sql`
4. Click "Run" to execute the migration

**Option B: Using Supabase CLI** (if you have it installed)
```bash
supabase db push
```

### Step 2: Fix Existing Users (Optional)

If you have users who are already in the "Signed Up" state but not showing in User Management, you can manually fix them:

```sql
-- This query will show you users in auth.users but not in public.users
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'role' as role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- For each user found, insert them into public.users:
INSERT INTO public.users (id, email, full_name, role, status, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name,
  COALESCE(au.raw_user_meta_data->>'role', 'employee') as role,
  'active' as status,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = 'active';
```

### Step 3: Test

1. Invite a new user through the admin panel
2. Have them sign up using the invitation link
3. Check that they appear in BOTH:
   - Pending Invitations section (with "✓ Signed Up" status)
   - User Management section (as an active user)

## Verification

After applying the fix:
- New invited users who sign up should immediately appear in the User Management section
- The trigger will automatically clean up any email conflicts
- Users can be assigned roles and managed properly

## Notes
- The trigger now automatically handles cleanup of orphaned user records
- No manual insertion is needed in the signup route - the trigger handles everything
- Existing "signed up" users may need the manual SQL fix above to appear in User Management
