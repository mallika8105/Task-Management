-- Fix task_in_progress notification type
-- This ensures the CHECK constraint properly includes task_in_progress

-- Drop the old constraint if it exists
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the correct constraint with all notification types including task_in_progress
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

-- Also drop any enum type if it exists (cleanup from previous migration attempts)
DROP TYPE IF EXISTS notification_type CASCADE;
