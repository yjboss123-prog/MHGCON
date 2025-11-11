/*
  # Add task attachments and performance indexes

  ## New Tables
  - `task_attachments` - Store file attachments for tasks
    - `id` (bigserial, primary key)
    - `task_id` (uuid, foreign key to tasks)
    - `file_url` (text) - URL or path to the file
    - `caption` (text) - Optional description
    - `uploaded_by` (uuid) - User token of uploader
    - `created_at` (timestamptz)

  ## Performance Indexes
  - `idx_tasks_assigned` - Index on assigned_user_token for fast "My Tasks" queries
  - `idx_tasks_due` - Index on due_date for overdue/upcoming task queries
  - `idx_tasks_trade` - Index on trade for filtering by trade type
  - `idx_tasks_phase` - Index on phase for construction phase filtering
  - `idx_tasks_project` - Index on project_id for multi-project support
  - `idx_comments_task` - Index on task_id for fast comment lookups
  - `idx_progress_updates_task` - Index on task_id for fast progress lookups

  ## Security
  - Enable RLS on task_attachments
  - Public read access (same as tasks)
  - Only authenticated users can insert
*/

-- Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id bigserial PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  caption text,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_attachments
CREATE POLICY "Anyone can view task attachments"
  ON task_attachments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upload attachments"
  ON task_attachments FOR INSERT
  WITH CHECK (true);

-- Performance indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_user_token) WHERE assigned_user_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_trade ON tasks(trade) WHERE trade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase) WHERE phase IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Performance indexes for related tables
CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_task ON progress_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
