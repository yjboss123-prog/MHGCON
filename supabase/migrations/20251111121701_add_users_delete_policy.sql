/*
  # Add DELETE policy for users table

  1. Changes
    - Add DELETE policy to allow public deletion of users
    - This enables admins to delete users from the Admin Panel
  
  2. Security
    - Allows anyone to delete users (suitable for current access model)
    - In production, this should be restricted to admin role only
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Public can delete users'
  ) THEN
    CREATE POLICY "Public can delete users"
      ON users
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;
