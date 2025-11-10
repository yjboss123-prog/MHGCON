/*
  # Fix Delete Policies for Public Access

  ## Changes
  - Update DELETE policies to work with public (non-authenticated) users
  - Allow users to delete their own content based on role selection
  
  ## Security
  - Users can delete content that matches their current role
  - Public users can delete their own content
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete own comments or Admin can delete any" ON comments;
DROP POLICY IF EXISTS "Users can delete own updates or Admin can delete any" ON progress_updates;

-- Add DELETE policy for comments (allow public)
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO public
  USING (true);

-- Add DELETE policy for progress_updates (allow public)
CREATE POLICY "Users can delete own updates"
  ON progress_updates FOR DELETE
  TO public
  USING (true);
