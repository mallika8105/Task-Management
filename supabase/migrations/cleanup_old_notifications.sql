-- Clean up all existing notifications
-- This will remove all notifications from the database
-- New notifications will be created going forward

-- Delete all existing notifications
DELETE FROM notifications;

-- Optional: You can also reset the sequence if you want to start fresh
-- This is commented out as it's optional
-- ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;
