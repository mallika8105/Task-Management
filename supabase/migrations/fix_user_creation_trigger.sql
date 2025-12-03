-- Fix the trigger to handle both id and email conflicts
-- This ensures users are properly created in public.users table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _full_name TEXT;
  _role TEXT;
BEGIN
  -- Log the raw_user_meta_data for debugging
  RAISE NOTICE 'handle_new_user: NEW.raw_user_meta_data = %', NEW.raw_user_meta_data;

  -- Safely extract full_name, defaulting to an empty string if not found
  SELECT COALESCE(NEW.raw_user_meta_data->>'full_name', '') INTO _full_name;
  -- Safely extract role, defaulting to 'employee' if not found
  SELECT COALESCE(NEW.raw_user_meta_data->>'role', 'employee') INTO _role;

  RAISE NOTICE 'handle_new_user: extracted full_name = %, role = %', _full_name, _role;

  -- First, delete any existing user with this email but different id
  -- This handles the case where a user was partially created
  DELETE FROM public.users WHERE email = NEW.email AND id != NEW.id;
  
  -- Insert or update user in public.users
  -- Handle conflict on id (primary key)
  INSERT INTO public.users (id, email, full_name, role, status, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    _full_name,
    _role,
    'active',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = 'active';
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
