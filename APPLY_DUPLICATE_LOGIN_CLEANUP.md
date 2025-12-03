# Apply Duplicate Login Notification Cleanup

## Overview
This guide walks you through applying the migration to clean up duplicate login notifications.

## Migration File
`supabase/migrations/cleanup_duplicate_login_notifications.sql`

## Option 1: Apply via Supabase Dashboard (Recommended)

1. **Navigate to your Supabase project**
   - Go to https://supabase.com/dashboard
   - Select your project: `qelloucyeengtsfnsvcd`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the migration**
   - Copy the contents of `supabase/migrations/cleanup_duplicate_login_notifications.sql`
   - Paste into a new query
   - Click "Run" to execute

The migration will:
- Remove all duplicate login notifications
- Keep only the most recent notification for each user-admin pair

## Option 2: Apply via Supabase CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase (if not already logged in)
npx supabase login

# Link to your project
npx supabase link --project-ref qelloucyeengtsfnsvcd

# Apply the migration
npx supabase db push
```

## Verification

After applying the migration:

1. **Check the notification panel as admin**
   - Login as admin
   - Open the notification panel (bell icon)
   - You should only see one login notification per user (the most recent one)

2. **Test duplicate prevention**
   - Login as a non-admin user
   - Check admin notifications - should see one login notification
   - Login again immediately (within 1 hour)
   - Check admin notifications - should still see only one notification (no new duplicate created)

## Expected Results

Before the fix:
```
🔔 User Login
   keerthana (keerthanakeerthu601@gmail.com) has logged in successfully
   6h ago

🔔 User Login
   keerthana (keerthanakeerthu601@gmail.com) has logged in successfully
   7h ago
```

After the fix:
```
🔔 User Login
   keerthana (keerthanakeerthu601@gmail.com) has logged in successfully
   6h ago
```

## What Happens Next

With the updated code in `lib/supabase/notification-helpers.ts`:
- Only one login notification per user within a 1-hour window
- Old login notifications automatically deleted after 1 hour
- No more duplicate notifications accumulating

## Troubleshooting

If you still see duplicates after applying:
1. Clear your browser cache and reload
2. Verify the migration was executed successfully in Supabase dashboard
3. Check the browser console for any errors
4. Ensure the `lib/supabase/notification-helpers.ts` changes are deployed

## Files Modified by This Fix

1. ✅ `lib/supabase/notification-helpers.ts` - Updated with deduplication logic
2. ✅ `supabase/migrations/cleanup_duplicate_login_notifications.sql` - Cleanup migration
3. ✅ `DUPLICATE_LOGIN_NOTIFICATION_FIX.md` - Documentation
4. ✅ `APPLY_DUPLICATE_LOGIN_CLEANUP.md` - This instruction guide
