# Fix User Deletion Issue - Migration Instructions

## Problem
When an employee account is deleted, their assigned tasks show "Unassigned" instead of showing their name with "(Inactive)" label.

## Root Cause
The `users` table has `ON DELETE CASCADE` constraint, which deletes the user record from `public.users` when deleted from `auth.users`. This causes task assignments to become NULL.

## Solution
Change the foreign key constraint to `ON DELETE NO ACTION` so user records are preserved for task history.

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Migration to fix user deletion cascade issue
-- This ensures user records are preserved when auth user is deleted
-- so tasks can still show who they were assigned to

-- First, drop the existing foreign key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Add it back without CASCADE DELETE
-- This means deleting from auth.users won't delete from public.users
ALTER TABLE users 
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE NO ACTION;
```

5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have Supabase CLI configured locally:

```bash
npx supabase db push
```

### Verification

After running the migration:

1. The constraint should be updated successfully
2. When you delete an employee, their record will remain in `public.users` with `status = 'inactive'`
3. Tasks assigned to deleted employees will show their name with "(Inactive)" label

### What This Fix Does

- **Before**: Deleting employee → Removes from `auth.users` → CASCADE deletes from `public.users` → Tasks show "Unassigned"
- **After**: Deleting employee → Removes from `auth.users` → Record stays in `public.users` → API marks `status = 'inactive'` → Tasks show "Name (Inactive)"

## Already Deleted Users

If you have already deleted users and their tasks are showing "Unassigned", those records are unfortunately lost. However, all future deletions will preserve the user data correctly.
