/*
  # Add shift indicator to tasks

  1. Changes
    - Add `was_shifted` boolean column to tasks table
    - Add `last_shift_date` timestamp column to track when last shifted
    - Default was_shifted to false for existing tasks

  2. Purpose
    - Track which tasks have been shifted due to delays
    - Show visual indicators in UI for shifted tasks
*/

-- Add was_shifted column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'was_shifted'
  ) THEN
    ALTER TABLE tasks ADD COLUMN was_shifted boolean DEFAULT false;
  END IF;
END $$;

-- Add last_shift_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'last_shift_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN last_shift_date timestamptz;
  END IF;
END $$;

-- Set existing tasks to not shifted
UPDATE tasks SET was_shifted = false WHERE was_shifted IS NULL;
