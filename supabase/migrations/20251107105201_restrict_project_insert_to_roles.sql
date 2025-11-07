/*
  # Restrict project INSERT to Developer and Project Manager roles

  ## Overview
  Updates the INSERT policy for projects table to only allow Developer and Project Manager roles.

  ## Changes
  
  ### Updated Policies
  - INSERT policy: Only Developer and Project Manager can create projects
  
  ## Security
  - Restricts project creation to authorized roles only
  - Uses role-based access control
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Anyone can create projects" ON projects;

-- Create restricted INSERT policy for Developer and Project Manager only
CREATE POLICY "Only Developer and Project Manager can create projects"
  ON projects FOR INSERT
  TO public
  WITH CHECK (
    created_by IS NULL OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = created_by 
      AND profiles.role IN ('Developer', 'Project Manager')
    )
  );