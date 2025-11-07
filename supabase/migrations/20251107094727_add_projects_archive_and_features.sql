/*
  # Add Multi-Project Management Features

  ## Overview
  Enables Excel-style sheets functionality for managing multiple projects in parallel.
  Users can switch between projects, create new ones, and archive old ones.

  ## Changes to Projects Table
  
  ### New Columns
  - `archived` (boolean) - Whether the project is archived (hidden by default)
  - `created_by` (uuid, optional) - User who created the project (for future auth)
  
  ## Security
  - RLS remains open for public access (no auth requirement)
  - Future: Restrict operations based on created_by field
  
  ## Notes
  - Each project maintains its own tasks, comments, and progress updates
  - Project switching updates the active context in the UI
  - URL syncing allows direct links to specific projects
*/

-- Add archived column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'archived'
  ) THEN
    ALTER TABLE projects ADD COLUMN archived boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add created_by column for future auth integration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE projects ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster archived filtering
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);

-- Create index for created_by lookups
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);