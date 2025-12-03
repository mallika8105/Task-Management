-- Check current status of all users
SELECT id, email, full_name, role, status, created_at
FROM public.users
ORDER BY created_at DESC;

-- Reactivate a specific user by email (replace with actual email)
-- UPDATE public.users 
-- SET status = 'active' 
-- WHERE email = 'your-email@example.com';

-- Or reactivate ALL inactive users
-- UPDATE public.users 
-- SET status = 'active' 
-- WHERE status = 'inactive';
