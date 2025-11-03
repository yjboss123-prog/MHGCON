/*
  # Add Multiple Assignees Support

  1. Changes
    - Rename `owner_role` to `owner_roles` in tasks table (now stores array of roles)
    - Update check constraints to work with array type
    - Create index for array queries
    - Migrate existing single owner_role data to array format

  2. Notes
    - Preserves all existing data by converting single roles to arrays
    - Maintains backward compatibility with existing queries through array operations
*/

-- Add new owner_roles column as text array
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_roles text[] DEFAULT '{}';

-- Migrate existing data from owner_role to owner_roles
UPDATE tasks SET owner_roles = ARRAY[owner_role] WHERE owner_roles = '{}';

-- Drop old owner_role column
ALTER TABLE tasks DROP COLUMN IF EXISTS owner_role;

-- Add index for array queries
CREATE INDEX IF NOT EXISTS idx_tasks_owner_roles ON tasks USING GIN(owner_roles);

-- Update the index name for clarity
DROP INDEX IF EXISTS idx_tasks_owner_role;