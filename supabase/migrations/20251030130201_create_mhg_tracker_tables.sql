/*
  # MHG Site Progress Tracker Schema

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `name` (text) - task name
      - `owner_role` (text) - role that owns this task
      - `start_date` (date) - task start date
      - `end_date` (date) - task end date
      - `percent_done` (int) - completion percentage 0-100
      - `status` (text) - On Track, Delayed, Blocked, Done
      - `delay_reason` (text, nullable) - required if Delayed/Blocked and %<100
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `comments`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `author_role` (text) - role of comment author
      - `message` (text) - comment text
      - `created_at` (timestamptz)

    - `progress_updates`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `author_role` (text) - role who made the update
      - `percent_done` (int) - completion % at time of update
      - `status` (text) - status at time of update
      - `delay_reason` (text, nullable)
      - `note` (text, nullable) - optional note
      - `photo_base64` (text, nullable) - base64 encoded photo
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Allow public read access for MVP (all roles can see everything)
    - Allow public write access for MVP (role enforcement in UI)
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_role text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  percent_done int NOT NULL DEFAULT 0 CHECK (percent_done >= 0 AND percent_done <= 100),
  status text NOT NULL DEFAULT 'On Track' CHECK (status IN ('On Track', 'Delayed', 'Blocked', 'Done')),
  delay_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_role text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create progress_updates table
CREATE TABLE IF NOT EXISTS progress_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_role text NOT NULL,
  percent_done int NOT NULL CHECK (percent_done >= 0 AND percent_done <= 100),
  status text NOT NULL CHECK (status IN ('On Track', 'Delayed', 'Blocked', 'Done')),
  delay_reason text,
  note text,
  photo_base64 text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_task_id ON progress_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_role ON tasks(owner_role);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;

-- For MVP: Allow all operations for everyone (role enforcement in UI)
CREATE POLICY "Allow public read access on tasks"
  ON tasks FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on tasks"
  ON tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on tasks"
  ON tasks FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on tasks"
  ON tasks FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access on comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on comments"
  ON comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access on progress_updates"
  ON progress_updates FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on progress_updates"
  ON progress_updates FOR INSERT
  WITH CHECK (true);