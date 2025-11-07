/*
  # Add INSERT and DELETE policies for projects table

  ## Overview
  Adds missing RLS policies to allow public access for creating and deleting projects.

  ## Changes
  
  ### New Policies
  - INSERT policy: Anyone can create projects
  - DELETE policy: Anyone can delete projects
  
  ## Security Note
  - Currently using public access for all operations (no auth required)
  - When authentication is implemented, these policies should be restricted to authenticated users
*/

-- Drop policies if they exist and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can create projects" ON projects;
  DROP POLICY IF EXISTS "Anyone can delete projects" ON projects;
END $$;

-- Add INSERT policy for projects
CREATE POLICY "Anyone can create projects"
  ON projects FOR INSERT
  TO public
  WITH CHECK (true);

-- Add DELETE policy for projects
CREATE POLICY "Anyone can delete projects"
  ON projects FOR DELETE
  TO public
  USING (true);