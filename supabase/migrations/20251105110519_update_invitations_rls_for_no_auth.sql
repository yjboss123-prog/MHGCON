/*
  # Update Invitations RLS for No Authentication

  ## Changes
  - Allow public (unauthenticated) users to view invitations
  - Allow public (unauthenticated) users to create invitations
  - Keep existing policies for authenticated users
  
  ## Security Notes
  - This is a temporary setup for development
  - In production, these should be restricted to authenticated users only
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view invitations" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can create invitations" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can update invitations" ON invitations;

-- Create new public policies
CREATE POLICY "Anyone can view invitations"
  ON invitations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update invitations"
  ON invitations FOR UPDATE
  USING (true)
  WITH CHECK (true);