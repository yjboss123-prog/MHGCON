/*
  # Add DELETE Policy for Invitations
  
  ## Changes
  - Add DELETE policy to allow removal of invitations
  
  ## Security
  - Allow public users to delete invitations (same as other operations)
  - This maintains consistency with existing SELECT, INSERT, and UPDATE policies
*/

-- Add DELETE policy for invitations
CREATE POLICY "Anyone can delete invitations"
  ON invitations FOR DELETE
  TO public
  USING (true);
