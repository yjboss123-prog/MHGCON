-- Simplify Tasks RLS for Code-Based Authentication
-- Remove auth-based policies and allow public access for all operations

-- Drop restrictive policies that check auth
DROP POLICY IF EXISTS "Admin and Project Manager can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Admin and Project Manager can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks based on role" ON tasks;

-- Ensure public access policies exist (some may already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' AND policyname = 'Public can insert tasks'
  ) THEN
    CREATE POLICY "Public can insert tasks"
      ON tasks FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' AND policyname = 'Public can update tasks'
  ) THEN
    CREATE POLICY "Public can update tasks"
      ON tasks FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' AND policyname = 'Public can delete tasks'
  ) THEN
    CREATE POLICY "Public can delete tasks"
      ON tasks FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;