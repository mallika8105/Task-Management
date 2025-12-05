# Apply User Deletion Fix - Quick Start Guide

## Prerequisites

Before applying this fix, ensure you have:
- Access to your Supabase project dashboard
- OR Supabase CLI installed locally

## Method 1: Using Supabase Dashboard (Easiest)

1. **Log in to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/fix_user_deletion_final.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Success**
   - You should see success messages in the output
   - Look for the notice: "Foreign key constraint users_id_fkey successfully created with ON DELETE NO ACTION"

## Method 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to your project directory
cd "c:/Users/91810/OneDrive/Desktop/Projects/Task Management System"

# Push all pending migrations
npx supabase db push
```

This will apply all migrations including the new `fix_user_deletion_final.sql`.

## Method 3: Database Reset (Development Only)

⚠️ **WARNING**: This will delete all data in your database!

Only use this if you're in development and don't have important data:

```bash
# Reset database and apply all migrations from scratch
npx supabase db reset
```

## Testing the Fix

After applying the migration:

1. **Open your application**
   - Navigate to http://localhost:3000 (or your deployment URL)

2. **Go to Admin Panel**
   - Log in as an admin user
   - Navigate to `/admin/users`

3. **Test User Deletion**
   - Find a user or pending invitation
   - Click "Delete" or "Revoke"
   - Confirm the deletion

4. **Expected Result**
   - ✅ No 500 error
   - ✅ User/invitation is removed from the list
   - ✅ Success message appears

## Troubleshooting

### Error: "constraint does not exist"
This is normal if it's the first time running the migration. The script handles this gracefully.

### Error: "column already exists"
This is also normal and handled by the IF NOT EXISTS checks in the migration.

### Still Getting 500 Error
1. Check the browser console for detailed error messages
2. Check your terminal/server logs for the exact error
3. Verify the migration ran successfully in Supabase dashboard
4. Run the verification queries from `USER_DELETION_FIX_FINAL.md`

## Next Steps

Once the fix is applied and tested successfully:
- The user deletion feature should work without errors
- Deleted users will be marked as inactive but preserved in the database
- Historical task assignments will remain intact

## Need Help?

If you encounter issues:
1. Check the detailed documentation in `USER_DELETION_FIX_FINAL.md`
2. Run the verification SQL queries to check the database state
3. Check browser console and server logs for specific error messages
