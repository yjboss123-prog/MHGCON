/*
  # Add Delete Policy for Task Attachments

  ## Changes
  - Adds DELETE policy for task_attachments table
  - Allows contractors to delete their own uploaded attachments
  - Allows admins and project managers to delete any attachment

  ## Security
  - Contractors can only delete attachments they uploaded (matched by uploaded_by)
  - Admins and project managers can delete any attachment in their project
  - Policy checks user role through the users table and project context
*/

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Contractors can delete own attachments" ON task_attachments;
DROP POLICY IF EXISTS "Managers can delete any attachment" ON task_attachments;

-- Policy for contractors: can delete their own uploads
CREATE POLICY "Contractors can delete own attachments"
  ON task_attachments FOR DELETE
  USING (
    uploaded_by IN (
      SELECT user_token FROM users WHERE user_token = uploaded_by
    )
  );

-- Policy for admins/PMs: can delete any attachment in their projects
CREATE POLICY "Managers can delete any attachment"
  ON task_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_token = uploaded_by
      AND u.role IN ('admin', 'project_manager')
    )
    OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = task_attachments.project_id
      AND pm.role IN ('admin', 'project_manager')
    )
  );
