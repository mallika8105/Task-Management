-- Delete all old notifications for madhup73488@gmail.com
-- Run this if you see notifications showing "5d ago" or other old dates

DO $$
DECLARE
    user_id_var UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO user_id_var 
    FROM users 
    WHERE email = 'madhup73488@gmail.com';
    
    IF user_id_var IS NULL THEN
        RAISE NOTICE 'No user found with email madhup73488@gmail.com';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user ID: %', user_id_var;
    
    -- Delete all notifications for this user
    DELETE FROM notifications 
    WHERE recipient_id = user_id_var 
    OR sender_id = user_id_var;
    
    RAISE NOTICE 'All notifications cleaned up for madhup73488@gmail.com';
    RAISE NOTICE 'New notifications will show correct timestamps';
END $$;
