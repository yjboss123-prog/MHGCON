/*
  # Add contractor_role field to users table

  ## Changes
  - Add `contractor_role` column to `users` table to store the specific contractor role
    (e.g., "Architect", "Construction Contractor", "Chief of Plumbing", etc.)
  - This allows contractors to choose their specific role while maintaining the base 'contractor' role for permissions
  - For admin/developer/project_manager users, this field will be NULL

  ## Notes
  - The existing `role` field remains for permission checks ('contractor', 'admin', 'developer', 'project_manager')
  - The new `contractor_role` field stores the actual contractor type for task assignment
*/

-- Add contractor_role column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'contractor_role'
  ) THEN
    ALTER TABLE users ADD COLUMN contractor_role text;
  END IF;
END $$;
