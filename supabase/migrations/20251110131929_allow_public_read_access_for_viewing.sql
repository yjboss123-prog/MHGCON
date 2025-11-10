/*
  # Allow Public Read Access for Viewing
  
  ## Changes
  1. Add public read access for tasks - allows anyone to view the Gantt chart
  2. Ensure projects remain publicly viewable
  3. Keep write operations restricted to authenticated users with proper roles
  
  ## Security
  - Public users can only READ (SELECT) data
  - All write operations (INSERT, UPDATE, DELETE) require authentication
  - Role-based permissions remain enforced for modifications
*/

-- Allow public read access to tasks
CREATE POLICY "Public can view tasks"
  ON tasks FOR SELECT
  TO public
  USING (true);

-- Ensure projects are publicly viewable (should already exist but confirm)
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  TO public
  USING (true);
