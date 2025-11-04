/*
  # Fix Projects RLS for Public Access

  1. Changes
    - Drop the authenticated-only update policy
    - Add a public update policy to allow anyone to update projects
    - This matches the app's current authentication model (no auth required)

  2. Security
    - Since this is a demo/prototype app without authentication
    - Public access is acceptable for this use case
*/

DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;

CREATE POLICY "Anyone can update projects"
  ON projects
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
