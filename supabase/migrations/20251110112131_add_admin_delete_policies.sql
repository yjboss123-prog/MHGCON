/*
  # Add Admin Delete Policies

  ## Changes
  - Add DELETE policies for comments table (Admin only)
  - Add DELETE policies for progress_updates table (Admin only)
  
  ## Security
  - Only Admin can delete comments
  - Only Admin can delete progress updates
*/

-- Add DELETE policy for comments (Admin only)
CREATE POLICY "Admin can delete comments"
  ON comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Add DELETE policy for progress_updates (Admin only)
CREATE POLICY "Admin can delete progress updates"
  ON progress_updates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );
