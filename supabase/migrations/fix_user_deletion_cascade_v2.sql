-- Migration to fix user deletion cascade issue (V2)
-- This ensures user records are preserved when auth user is deleted
-- so tasks can still show who they were assigned to

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Add it back without CASCADE DELETE
-- This means deleting from auth.users won't delete from public.users
ALTER TABLE IF EXISTS users 
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE NO ACTION;

-- Ensure status column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active';
  END IF;
END $$;

-- Note: The delete-user API will handle soft deletion by marking status as 'inactive'
-- This preserves user records for historical task assignment tracking
