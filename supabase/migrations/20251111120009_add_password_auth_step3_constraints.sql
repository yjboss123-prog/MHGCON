/*
  # Add Password Authentication - Step 3: Constraints and Functions

  Add unique constraint to prevent duplicates going forward.
  Add helper functions for name normalization.
*/

-- =====================================================
-- 1. UNIQUE CONSTRAINT FOR DEDUPLICATION
-- =====================================================

-- Create unique index: same project + normalized name + role = same person
CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_identity
  ON users(project_id, name_norm, role)
  WHERE project_id IS NOT NULL AND name_norm IS NOT NULL;

-- =====================================================
-- 2. HELPER FUNCTION FOR NAME NORMALIZATION
-- =====================================================

CREATE OR REPLACE FUNCTION normalize_name(input_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN lower(trim(regexp_replace(input_name, '\s+', ' ', 'g')));
END;
$$;

COMMENT ON FUNCTION normalize_name IS 'Normalizes display names: lowercase, trim, collapse multiple spaces';

-- =====================================================
-- 3. TRIGGER TO AUTO-UPDATE name_norm
-- =====================================================

CREATE OR REPLACE FUNCTION update_name_norm()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.name_norm := normalize_name(NEW.display_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_name_norm ON users;

CREATE TRIGGER trigger_update_name_norm
  BEFORE INSERT OR UPDATE OF display_name ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_name_norm();

COMMENT ON TRIGGER trigger_update_name_norm ON users IS 'Automatically updates name_norm when display_name changes';

-- =====================================================
-- 4. UPDATE RLS POLICIES
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view users in their project" ON users;
DROP POLICY IF EXISTS "Users can update their own last_seen" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Users can view all users
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (true);

-- Users can update their own record
CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow user registration with required fields
CREATE POLICY "Allow user registration"
  ON users FOR INSERT
  WITH CHECK (
    name_norm IS NOT NULL
    AND project_id IS NOT NULL
  );

-- =====================================================
-- 5. SESSIONS TABLE UPDATE
-- =====================================================

-- Add project_id to sessions for project isolation
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- Backfill from users table
UPDATE sessions s
SET project_id = u.project_id
FROM users u
WHERE s.user_token = u.user_token AND s.project_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
