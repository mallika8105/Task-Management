-- Add notification types for all task status changes
-- The notifications table uses a CHECK constraint, not an enum
-- This migration updates the CHECK constraint to include new notification types

-- Drop the old constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new constraint with all notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'task_assigned', 
  'task_completed', 
  'task_in_progress',
  'comment_added', 
  'task_updated', 
  'message_sent', 
  'pr_raised',
  'user_signup',
  'user_login'
));
