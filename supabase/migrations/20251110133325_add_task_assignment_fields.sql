/*
  # Add Task Assignment Fields

  ## Changes
  1. Add assignment fields to tasks table:
    - `assigned_user_token` (uuid) - who the task is assigned to
    - `assigned_display_name` (text) - cached display name for performance
    - `created_by_token` (uuid) - who created the task
    - `created_by_role` (text) - role of creator at time of creation

  ## Notes
  - Existing tasks will have NULL values for these fields
  - Tasks can be assigned to specific users or remain unassigned
*/

-- Add new columns to tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS assigned_user_token uuid REFERENCES users(user_token) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_display_name text,
  ADD COLUMN IF NOT EXISTS created_by_token uuid REFERENCES users(user_token) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_role text;

-- Create index for assignment lookups
CREATE INDEX IF NOT EXISTS tasks_assigned_user_idx ON tasks(assigned_user_token);
CREATE INDEX IF NOT EXISTS tasks_created_by_idx ON tasks(created_by_token);
