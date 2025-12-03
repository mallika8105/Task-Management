-- Final fix for user deletion cascade issue
-- This migration ensures the foreign key constraint is properly set to ON DELETE NO ACTION
-- and that the status column exists for soft deletion

-- Step 1: Ensure status column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active';
    CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
  END IF;
END $$;

-- Step 2: Update any NULL status values to 'active'
UPDATE public.users SET status = 'active' WHERE status IS NULL;

-- Step 3: Drop the existing foreign key constraint
ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Step 4: Add the constraint back with ON DELETE NO ACTION
-- This prevents cascade deletion and preserves user records for historical data
ALTER TABLE public.users 
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE NO ACTION;

-- Verify the constraint was created correctly
DO $$
DECLARE
  constraint_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_id_fkey' 
    AND table_name = 'users'
    AND table_schema = 'public'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE 'Foreign key constraint users_id_fkey successfully created with ON DELETE NO ACTION';
  ELSE
    RAISE EXCEPTION 'Failed to create foreign key constraint users_id_fkey';
  END IF;
END $$;
