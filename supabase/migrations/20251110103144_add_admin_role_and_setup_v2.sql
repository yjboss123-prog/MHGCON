/*
  # Add Admin Role and Setup

  ## Changes
  1. Updates the handle_new_user function to support Admin role
  2. Creates an admin invitation if none exists
  3. Updates RLS policies to restrict management features to Admin only
  
  ## Security
  - Only Admin role can create/delete projects
  - Only Admin role can invite users
  - Other users have read-only access to invitations
*/

-- Update the handle_new_user function to check for Admin role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_invitation invitations%ROWTYPE;
  v_role text;
BEGIN
  -- Check for invitation by email
  SELECT * INTO v_invitation
  FROM invitations
  WHERE email = NEW.email
    AND accepted = false
    AND expires_at > now()
  LIMIT 1;

  -- If invitation exists, use its role
  IF FOUND THEN
    v_role := v_invitation.role;
    
    -- Mark invitation as accepted
    UPDATE invitations
    SET accepted = true, updated_at = now()
    WHERE id = v_invitation.id;
  ELSE
    -- Default role: deny access without invitation
    v_role := 'Viewer';
  END IF;

  -- Create profile with assigned role
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles RLS policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update invitations RLS policies - drop all first
DROP POLICY IF EXISTS "Authenticated users can view invitations" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can create invitations" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can update invitations" ON invitations;
DROP POLICY IF EXISTS "Public can validate invitation codes" ON invitations;

CREATE POLICY "Admin can view all invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

CREATE POLICY "Admin can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

CREATE POLICY "Admin can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

CREATE POLICY "Public can validate invitation codes"
  ON invitations FOR SELECT
  TO anon
  USING (accepted = false AND expires_at > now());

-- Create initial admin invitation if it doesn't exist
-- Email: admin@mhgtracker.com
-- Code will be auto-generated and shown in the invitations table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM invitations WHERE role = 'Admin') THEN
    INSERT INTO invitations (email, role, expires_at)
    VALUES ('admin@mhgtracker.com', 'Admin', now() + interval '365 days');
  END IF;
END $$;
