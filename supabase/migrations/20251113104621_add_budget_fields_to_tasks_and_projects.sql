/*
  # Add Budget Fields to Tasks and Projects

  1. Changes to Tasks Table
    - Add `budget` column (numeric, default 0)
    - Budget represents the total allocated amount for the task

  2. Changes to Projects Table
    - Add `project_budget` column (numeric, default 0)
    - Project budget will be calculated as sum of all task budgets

  3. Notes
    - Budget fields are nullable initially but default to 0
    - Earned value and remaining are calculated in the application layer
    - No new tables or complex finance structures added
*/

-- Add budget field to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'budget'
  ) THEN
    ALTER TABLE tasks ADD COLUMN budget numeric DEFAULT 0;
  END IF;
END $$;

-- Add project_budget field to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_budget'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_budget numeric DEFAULT 0;
  END IF;
END $$;

-- Create index for performance on budget queries
CREATE INDEX IF NOT EXISTS idx_tasks_budget ON tasks(budget) WHERE budget > 0;
CREATE INDEX IF NOT EXISTS idx_projects_project_budget ON projects(project_budget);
