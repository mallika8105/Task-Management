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

-- Note: The delete-user API will handle soft deletion by marking status as 'inactive'
-- This preserves user records for historical task assignment tracking
