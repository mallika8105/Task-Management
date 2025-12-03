-- Add task_in_progress to notification type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_in_progress';
