/*
  # Add Custom Contractors to Project

  1. Changes
    - Add `custom_contractors` column to projects table (text array)
    - This stores additional contractor names beyond the default roles
    - Default to empty array for existing projects

  2. Notes
    - Custom contractors will be combined with default roles in the UI
    - Allows projects to add specialized contractor roles as needed
*/

-- Add custom_contractors column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS custom_contractors text[] DEFAULT '{}';

-- Initialize custom_contractors for existing projects
UPDATE projects SET custom_contractors = '{}' WHERE custom_contractors IS NULL;