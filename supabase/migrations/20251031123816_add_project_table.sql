/*
  # Add Project Metadata Table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text) - Project name
      - `description` (text) - Project description
      - `start_date` (date) - Project start date
      - `end_date` (date) - Project end date
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `project_id` column to `tasks` table if it doesn't exist
    - Create default project record
    - Link existing tasks to default project

  3. Security
    - Enable RLS on `projects` table
    - Add policies for authenticated users
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'MHG Tracker Project',
  description text DEFAULT 'SEBN Bouknadel – EXT 01/02',
  start_date date NOT NULL DEFAULT '2024-11-01',
  end_date date NOT NULL DEFAULT '2025-09-30',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add project_id to tasks if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

-- Insert default project
INSERT INTO projects (id, name, description, start_date, end_date)
VALUES ('00000000-0000-0000-0000-000000000001', 'MHG Tracker Project', 'SEBN Bouknadel – EXT 01/02', '2024-11-01', '2025-09-30')
ON CONFLICT (id) DO NOTHING;

-- Link existing tasks to default project
UPDATE tasks
SET project_id = '00000000-0000-0000-0000-000000000001'
WHERE project_id IS NULL;
