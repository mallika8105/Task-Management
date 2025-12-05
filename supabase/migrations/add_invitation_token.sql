-- Add invitation_token column to invitations table
ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(invitation_token);

-- Update existing pending invitations with tokens (optional, for existing data)
-- You may want to regenerate invitations for existing pending users
