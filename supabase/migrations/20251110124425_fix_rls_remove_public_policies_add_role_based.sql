/*
  # Fix RLS Policies - Remove Public Access and Add Role-Based Permissions
  
  ## Changes
  1. Drop conflicting public policies that allow unauthenticated access
  2. Add proper role-based policies for tasks:
     - Admin and Project Manager: Full access to all tasks
     - Contractors: Can only edit tasks assigned to their role (in owner_roles)
     - All authenticated users can view all tasks
  
  ## Security
  - Requires authentication for all operations
  - Enforces role-based access control
  - Contractors can only modify tasks where their role is in the owner_roles array
*/

-- Drop overly permissive public policies
DROP POLICY IF EXISTS "Allow public read access on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public insert on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public update on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public delete on tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can update projects" ON projects;
DROP POLICY IF EXISTS "Anyone can delete projects" ON projects;
DROP POLICY IF EXISTS "Only Developer and Project Manager can create projects" ON projects;

-- Tasks: Everyone can view
CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

-- Tasks: Admin and Project Manager can insert any task
CREATE POLICY "Admin and Project Manager can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'Project Manager')
    )
  );

-- Tasks: Admin and Project Manager can update any task
-- Contractors can only update tasks assigned to their role
CREATE POLICY "Users can update tasks based on role"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('Admin', 'Project Manager')
        OR profiles.role = ANY(tasks.owner_roles)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('Admin', 'Project Manager')
        OR profiles.role = ANY(tasks.owner_roles)
      )
    )
  );

-- Tasks: Only Admin and Project Manager can delete tasks
CREATE POLICY "Admin and Project Manager can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'Project Manager')
    )
  );
