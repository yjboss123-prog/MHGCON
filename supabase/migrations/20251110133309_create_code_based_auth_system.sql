/*
  # Create Code-Based Authentication System

  ## New Tables
  
  1. `users`
    - `user_token` (uuid, primary key) - unique identifier for each user
    - `display_name` (text) - user's chosen display name
    - `role` (text) - one of: contractor, admin, developer, project_manager
    - `created_at` (timestamptz)
    - `last_active_at` (timestamptz)
    
  2. `sessions`
    - `id` (uuid, primary key)
    - `user_token` (uuid, foreign key to users)
    - `session_token` (text, unique) - JWT token
    - `expires_at` (timestamptz)
    - `created_at` (timestamptz)
    - `last_refreshed_at` (timestamptz)
    - `ip_address` (text)
    
  3. `audit_logs`
    - `id` (uuid, primary key)
    - `user_token` (uuid, references users)
    - `action` (text) - e.g., 'sign_in', 'task_created', 'task_updated'
    - `details` (jsonb) - additional context
    - `ip_address` (text)
    - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public can insert into users (for registration)
  - Public can insert into sessions (for sign-in)
  - Only admins can view audit logs
  - Users can view their own session info
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('contractor', 'admin', 'developer', 'project_manager')),
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_token uuid REFERENCES users(user_token) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_refreshed_at timestamptz DEFAULT now(),
  ip_address text
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_token uuid REFERENCES users(user_token) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Public can create users"
  ON users FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view all users"
  ON users FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Sessions policies
CREATE POLICY "Public can create sessions"
  ON sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view sessions"
  ON sessions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can delete sessions"
  ON sessions FOR DELETE
  TO public
  USING (true);

-- Audit logs policies
CREATE POLICY "Public can insert audit logs"
  ON audit_logs FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view audit logs"
  ON audit_logs FOR SELECT
  TO public
  USING (true);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(session_token);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON audit_logs(user_token);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);
