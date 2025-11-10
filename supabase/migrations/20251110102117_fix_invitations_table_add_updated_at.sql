/*
  # Fix invitations table

  ## Changes
  - Add missing `updated_at` column to invitations table
  
  ## Notes
  This column is referenced in the handle_new_user() trigger function
  but was missing from the original table definition.
*/

-- Add updated_at column to invitations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invitations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE invitations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
