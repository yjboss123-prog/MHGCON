/*
  # Allow Users to Delete Their Own Content

  ## Changes
  - Update DELETE policies for comments (users can delete their own)
  - Update DELETE policies for progress_updates (users can delete their own)
  
  ## Security
  - Admin can delete any comment or update
  - Users can delete their own comments and updates (matching author_role to current role)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can delete comments" ON comments;
DROP POLICY IF EXISTS "Admin can delete progress updates" ON progress_updates;

-- Add DELETE policy for comments (Admin or author)
CREATE POLICY "Users can delete own comments or Admin can delete any"
  ON comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'Admin' OR profiles.role = author_role)
    )
  );

-- Add DELETE policy for progress_updates (Admin or author)
CREATE POLICY "Users can delete own updates or Admin can delete any"
  ON progress_updates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'Admin' OR profiles.role = author_role)
    )
  );
