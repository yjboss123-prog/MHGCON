/*
  # Allow Initial Task Seeding
  
  ## Changes
  - Add a policy to allow task insertion when the table is empty (initial seeding)
  - This allows the app to seed data on first load without authentication
  - Once tasks exist, normal role-based policies take over
  
  ## Security
  - Only works when tasks table is completely empty
  - After initial seed, all operations require authentication
*/

-- Allow public to insert tasks ONLY if the table is empty (for initial seeding)
CREATE POLICY "Allow initial seeding when table is empty"
  ON tasks FOR INSERT
  TO public
  WITH CHECK (
    (SELECT COUNT(*) FROM tasks) = 0
  );
