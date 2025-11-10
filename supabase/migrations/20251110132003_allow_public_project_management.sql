/*
  # Allow Public Project Management
  
  ## Changes
  1. Add public access for project CRUD operations
  2. This allows unauthenticated users to manage projects for demo purposes
  
  ## Security Note
  - This is intentionally permissive for a demo/testing application
  - In production, these policies should be restricted to authenticated users only
*/

-- Allow public to insert projects
CREATE POLICY "Public can create projects"
  ON projects FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to update projects
CREATE POLICY "Public can update projects"
  ON projects FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public to delete projects
CREATE POLICY "Public can delete projects"
  ON projects FOR DELETE
  TO public
  USING (true);

-- Also allow public to insert/update/delete tasks for full demo functionality
CREATE POLICY "Public can insert tasks"
  ON tasks FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update tasks"
  ON tasks FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete tasks"
  ON tasks FOR DELETE
  TO public
  USING (true);
