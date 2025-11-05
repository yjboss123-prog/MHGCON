/*
  # Add User Profiles and Invitation System

  ## Overview
  This migration adds authentication and role management to the MHG Tracker application.
  Users can be invited with specific roles and automatically assigned upon signup.

  ## New Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - References auth.users(id)
  - `email` (text) - User's email address
  - `full_name` (text) - User's full name
  - `role` (text) - Assigned contractor role (e.g., 'Construction Contractor', 'Plumber')
  - `avatar_url` (text, optional) - Profile picture URL
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `invitations`
  - `id` (uuid, primary key) - Unique invitation ID
  - `email` (text, unique) - Invited user's email
  - `role` (text) - Role to be assigned upon signup
  - `invitation_code` (text, unique) - Unique code for signup
  - `invited_by` (uuid, optional) - ID of user who sent invitation
  - `accepted` (boolean) - Whether invitation was accepted
  - `expires_at` (timestamptz) - Invitation expiration date
  - `created_at` (timestamptz) - Invitation creation timestamp

  ## Security
  - Enable RLS on both tables
  - Profiles: Users can read all profiles but only update their own
  - Invitations: Only authenticated users can view/create invitations
  - Public access for invitation code validation

  ## Functions & Triggers
  - Automatic profile creation on user signup
  - Auto-role assignment based on invitation
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  invitation_code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted boolean DEFAULT false,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Invitations policies
CREATE POLICY "Authenticated users can view invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can validate invitation codes"
  ON invitations FOR SELECT
  TO anon
  USING (accepted = false AND expires_at > now());

-- Function to handle new user signup
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
    -- Default role if no invitation
    v_role := 'Project Manager';
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

-- Trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();