/*
  # Add current date tracking to projects

  1. Changes
    - Add `project_current_date` column to `projects` table
      - Stores the "today" date for project timeline tracking
      - Allows marking where we are in the project timeline
      - Distinguishes between completed and upcoming work
    
  2. Notes
    - Uses DATE type to store just the date (no time component)
    - Defaults to today's date when not specified
    - This helps visualize project progress in the Gantt chart
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_current_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_current_date DATE DEFAULT now()::date;
  END IF;
END $$;