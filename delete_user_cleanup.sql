-- Script to delete a user and all related data
-- Replace 'madhup73488@gmail.com' with the actual email if different

DO $$
DECLARE
    user_id_to_delete UUID;
BEGIN
    -- Get the user ID from the email
    SELECT id INTO user_id_to_delete 
    FROM auth.users 
    WHERE email = 'madhup73488@gmail.com';
    
    IF user_id_to_delete IS NULL THEN
        RAISE NOTICE 'No user found with email madhup73488@gmail.com';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user ID: %', user_id_to_delete;
    
    -- Delete related data in order (to respect foreign key constraints)
    
    -- 1. Delete notifications (as recipient)
    DELETE FROM notifications WHERE recipient_id = user_id_to_delete;
    RAISE NOTICE 'Deleted notifications (recipient)';
    
    -- 2. Delete notifications (as sender) 
    DELETE FROM notifications WHERE sender_id = user_id_to_delete;
    RAISE NOTICE 'Deleted notifications (sender)';
    
    -- 3. Delete comments
    DELETE FROM comments WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Deleted comments';
    
    -- 4. Delete tasks where user is assigned
    DELETE FROM tasks WHERE assigned_to = user_id_to_delete;
    RAISE NOTICE 'Deleted assigned tasks';
    
    -- 5. Delete tasks created by user
    DELETE FROM tasks WHERE created_by = user_id_to_delete;
    RAISE NOTICE 'Deleted created tasks';
    
    -- 6. Delete invitations sent by this user
    DELETE FROM invitations WHERE invited_by = user_id_to_delete;
    RAISE NOTICE 'Deleted sent invitations';
    
    -- 7. Delete invitations for this email
    DELETE FROM invitations WHERE email = 'madhup73488@gmail.com';
    RAISE NOTICE 'Deleted invitations for this email';
    
    -- 8. Delete from public.users table
    DELETE FROM public.users WHERE id = user_id_to_delete;
    RAISE NOTICE 'Deleted from public.users';
    
    -- 9. Delete from auth.users (this frees up the email)
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    RAISE NOTICE 'Deleted from auth.users - email is now free!';
    
    RAISE NOTICE 'User madhup73488@gmail.com successfully deleted!';
END $$;
