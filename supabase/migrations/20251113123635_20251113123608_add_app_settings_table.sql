/*
  # Add app_settings table for global configuration

  1. New Tables
    - `app_settings`
      - `key` (text, primary key) - Setting name
      - `value` (jsonb) - Setting value
      - `description` (text, optional) - Setting description
      - `updated_at` (timestamptz) - Last update timestamp
      - `updated_by` (uuid, optional) - User token who updated the setting

  2. Initial Data
    - Insert default setting for `allow_new_users` = true

  3. Security
    - Enable RLS on `app_settings` table
    - Add policy for admins to read all settings
    - Add policy for admins to update settings
    - Non-admin users cannot access this table

  4. Important Notes
    - This table stores global application configuration
    - Only admin users can modify settings
    - All changes are tracked with timestamp and user
*/

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

-- Insert default setting for allowing new users
INSERT INTO app_settings (key, value, description)
VALUES (
  'allow_new_users',
  'true'::jsonb,
  'When enabled, new users can be created. When disabled, user creation is locked.'
)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all settings
CREATE POLICY "Admins can read app settings"
  ON app_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_token = (current_setting('request.jwt.claims', true)::json->>'user_token')::uuid
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can update settings
CREATE POLICY "Admins can update app settings"
  ON app_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_token = (current_setting('request.jwt.claims', true)::json->>'user_token')::uuid
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_token = (current_setting('request.jwt.claims', true)::json->>'user_token')::uuid
      AND users.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
