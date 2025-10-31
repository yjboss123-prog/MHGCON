/*
  # Add Weekly Progress Tracking for Gantt Chart

  1. Changes to Existing Tables
    - Add `week_number` and `year` columns to progress_updates table
    - This allows tracking which week the work was done

  2. New Table
    - `task_weeks`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `year` (int) - year of the week
      - `week_number` (int) - ISO week number (1-52/53)
      - `work_description` (text) - description of work done that week
      - `photos` (text[]) - array of base64 photo strings
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on new table
    - Allow public access for MVP

  4. Notes
    - Week-based tracking enables clicking on Gantt chart cells to view weekly progress
    - Maintains compatibility with existing data
*/

-- Add week tracking to progress_updates if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'progress_updates' AND column_name = 'week_number'
  ) THEN
    ALTER TABLE progress_updates ADD COLUMN week_number int;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'progress_updates' AND column_name = 'year'
  ) THEN
    ALTER TABLE progress_updates ADD COLUMN year int;
  END IF;
END $$;

-- Create task_weeks table for weekly progress tracking
CREATE TABLE IF NOT EXISTS task_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  year int NOT NULL,
  week_number int NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  work_description text NOT NULL DEFAULT '',
  photos text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(task_id, year, week_number)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_task_weeks_task_id ON task_weeks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_weeks_year_week ON task_weeks(year, week_number);

-- Enable RLS
ALTER TABLE task_weeks ENABLE ROW LEVEL SECURITY;

-- For MVP: Allow all operations for everyone
CREATE POLICY "Allow public read access on task_weeks"
  ON task_weeks FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on task_weeks"
  ON task_weeks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on task_weeks"
  ON task_weeks FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on task_weeks"
  ON task_weeks FOR DELETE
  USING (true);
