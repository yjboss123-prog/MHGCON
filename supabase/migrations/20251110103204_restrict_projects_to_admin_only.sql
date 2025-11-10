/*
  # Restrict Project Management to Admin Only

  ## Changes
  - Update projects table RLS policies
  - Only Admin can create, delete, archive projects
  - Everyone can view projects (for now)
  - Only Admin can update projects
  
  ## Security
  - Ensures only Admin has full control over project management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;
DROP POLICY IF EXISTS "Project managers can insert projects" ON projects;
DROP POLICY IF EXISTS "Project managers can delete projects" ON projects;

-- Anyone can view projects
CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  USING (true);

-- Only Admin can insert projects
CREATE POLICY "Admin can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Only Admin can update projects
CREATE POLICY "Admin can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Only Admin can delete projects
CREATE POLICY "Admin can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );
