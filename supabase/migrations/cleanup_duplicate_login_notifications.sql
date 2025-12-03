-- Clean up duplicate user_login notifications
-- Keep only the most recent login notification for each sender-recipient pair

-- Delete older duplicate login notifications, keeping only the most recent one for each user-admin combination
DELETE FROM notifications
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY sender_id, recipient_id, type 
        ORDER BY created_at DESC
      ) as rn
    FROM notifications
    WHERE type = 'user_login'
  ) AS ranked
  WHERE rn > 1
);

-- Add a comment to document this cleanup
COMMENT ON TABLE notifications IS 'Cleaned up duplicate user_login notifications on 2025-12-03';
