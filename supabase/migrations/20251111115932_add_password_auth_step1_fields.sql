/*
  # Add Password Authentication - Step 1: Add Fields

  Add password and normalization fields to users table.
  This is split into steps to handle existing data carefully.
*/

-- Add project_id for project isolation
ALTER TABLE users ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- Set default project for existing users
UPDATE users SET project_id = '00000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;

-- Add normalized name
ALTER TABLE users ADD COLUMN IF NOT EXISTS name_norm text;

-- Add password hash
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;

-- Add last seen
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();

-- Backfill normalized names
UPDATE users 
SET name_norm = lower(trim(regexp_replace(display_name, '\s+', ' ', 'g'))) 
WHERE name_norm IS NULL;

-- Add indexes for lookups
CREATE INDEX IF NOT EXISTS idx_users_project_role ON users(project_id, role);
CREATE INDEX IF NOT EXISTS idx_users_name_norm ON users(name_norm);

COMMENT ON COLUMN users.name_norm IS 'Normalized display name for case-insensitive matching';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password';
COMMENT ON COLUMN users.last_seen IS 'Last activity timestamp';
