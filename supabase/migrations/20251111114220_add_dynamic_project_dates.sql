/*
  # Add Dynamic Project Date Management

  ## Changes Made

  1. **Projects Table Updates**
    - Add `project_start_date` (date) - The start date for the project timeline
    - Add `project_duration_months` (integer) - Duration in months (9-12, default 12)
    - Set sensible defaults for existing projects

  2. **Tasks Table Updates**
    - Add `offset_days` (integer, nullable) - Days offset from project start for template tasks
    - Add `duration_days` (integer, nullable) - Task duration in days for templates
    - These fields enable template-based task creation

  ## Purpose
  - Enable flexible project start dates (not hardcoded to 2026)
  - Support 9-12 month project durations with auto-fit
  - Allow template tasks that can be reinitialized with new start dates
  - Mobile-friendly 6-month windows with panning support
*/

-- Add dynamic date fields to projects table
DO $$
BEGIN
  -- Add project_start_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_start_date'
  ) THEN
    ALTER TABLE projects 
    ADD COLUMN project_start_date date DEFAULT '2026-01-01';
  END IF;

  -- Add project_duration_months column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_duration_months'
  ) THEN
    ALTER TABLE projects 
    ADD COLUMN project_duration_months integer DEFAULT 12 CHECK (project_duration_months >= 9 AND project_duration_months <= 12);
  END IF;
END $$;

-- Add template task support fields
DO $$
BEGIN
  -- Add offset_days for template tasks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'offset_days'
  ) THEN
    ALTER TABLE tasks 
    ADD COLUMN offset_days integer;
  END IF;

  -- Add duration_days for template tasks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE tasks 
    ADD COLUMN duration_days integer;
  END IF;
END $$;

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);

-- Add helpful comment
COMMENT ON COLUMN projects.project_start_date IS 'ISO date when the project timeline begins';
COMMENT ON COLUMN projects.project_duration_months IS 'Project duration in months (9-12), auto-fits based on tasks';
COMMENT ON COLUMN tasks.offset_days IS 'Days offset from project_start_date for template tasks';
COMMENT ON COLUMN tasks.duration_days IS 'Task duration in days, used with offset_days for templates';
