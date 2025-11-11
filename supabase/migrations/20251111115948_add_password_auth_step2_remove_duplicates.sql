/*
  # Add Password Authentication - Step 2: Remove Duplicates

  Clean up duplicate users before adding unique constraint.
  Keep the most recently created user for each (project_id, name_norm, role) combination.
*/

-- Remove duplicates: keep most recent user_token per (project_id, name_norm, role)
DO $$
DECLARE
  dupe RECORD;
  keeper uuid;
BEGIN
  FOR dupe IN 
    SELECT project_id, name_norm, role
    FROM users
    WHERE project_id IS NOT NULL AND name_norm IS NOT NULL
    GROUP BY project_id, name_norm, role
    HAVING COUNT(*) > 1
  LOOP
    -- Find the most recent user_token to keep
    SELECT user_token INTO keeper
    FROM users
    WHERE project_id = dupe.project_id
      AND name_norm = dupe.name_norm
      AND role = dupe.role
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Delete all others
    DELETE FROM users
    WHERE project_id = dupe.project_id
      AND name_norm = dupe.name_norm
      AND role = dupe.role
      AND user_token != keeper;
      
    RAISE NOTICE 'Kept user % for project %, name %, role %', 
      keeper, dupe.project_id, dupe.name_norm, dupe.role;
  END LOOP;
END $$;
