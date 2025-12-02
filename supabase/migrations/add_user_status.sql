-- Add status column to users table for soft deletion
ALTER TABLE users ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Update existing users to be active
UPDATE users SET status = 'active' WHERE status IS NULL;
