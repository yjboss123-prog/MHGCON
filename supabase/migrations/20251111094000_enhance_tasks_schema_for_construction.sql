/*
  # Enhance tasks schema for construction management

  ## New Columns Added to tasks table
  - `due_date` (date) - When the task must be completed
  - `phase` (text) - Construction phase (e.g., Groundworks, Structure, MEP, Finition)
  - `trade` (text) - Specific trade (e.g., plumber, steel, electrician)
  - `priority` (integer, default 2) - Task priority (1=high, 2=medium, 3=low)
  - `dependency_ids` (uuid[]) - Array of task IDs this task depends on

  ## Notes
  - Uses `IF NOT EXISTS` to safely add columns
  - Preserves all existing data
  - Adds sensible defaults for new columns
*/

-- Add due_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN due_date date;
  END IF;
END $$;

-- Add phase column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'phase'
  ) THEN
    ALTER TABLE tasks ADD COLUMN phase text;
  END IF;
END $$;

-- Add trade column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'trade'
  ) THEN
    ALTER TABLE tasks ADD COLUMN trade text;
  END IF;
END $$;

-- Add priority column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'priority'
  ) THEN
    ALTER TABLE tasks ADD COLUMN priority integer DEFAULT 2;
  END IF;
END $$;

-- Add dependency_ids column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'dependency_ids'
  ) THEN
    ALTER TABLE tasks ADD COLUMN dependency_ids uuid[] DEFAULT '{}';
  END IF;
END $$;
