-- Add 'user_signup' notification type to the existing CHECK constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('task_assigned', 'task_completed', 'comment_added', 'task_updated', 'message_sent', 'pr_raised', 'user_signup'));
