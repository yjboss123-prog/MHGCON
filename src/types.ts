export type Role =
  | 'Developer'
  | 'Project Manager'
  | 'Construction Contractor'
  | 'Architect'
  | 'Chief of Plumbing'
  | 'Chief of Electronics'
  | string;

export type TaskStatus = 'On Track' | 'Delayed' | 'Blocked' | 'Done';

export type Task = {
  id: string;
  name: string;
  owner_roles: string[];
  start_date: string;
  end_date: string;
  due_date?: string;
  percent_done: number;
  status: TaskStatus;
  delay_reason?: string;
  was_shifted?: boolean;
  last_shift_date?: string;
  assigned_user_token?: string;
  assigned_display_name?: string;
  created_by_token?: string;
  created_by_role?: string;
  phase?: string;
  trade?: string;
  priority?: number;
  dependency_ids?: string[];
  created_at: string;
  updated_at: string;
  project_id?: string;
};

export type Comment = {
  id: string;
  task_id: string;
  author_role: string;
  message: string;
  created_at: string;
};

export type ProgressUpdate = {
  id: string;
  task_id: string;
  author_role: string;
  percent_done: number;
  status: TaskStatus;
  delay_reason?: string;
  note?: string;
  photo_base64?: string;
  created_at: string;
};

export type TaskAttachment = {
  id: number;
  task_id: string;
  file_url: string;
  caption?: string;
  uploaded_by?: string;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  custom_contractors: string[];
  project_current_date: string;
  archived: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_ROLES: string[] = [
  'Developer',
  'Project Manager',
  'Construction Contractor',
  'Architect',
  'Chief of Plumbing',
  'Chief of Electronics',
];

export const TASK_STATUSES: TaskStatus[] = ['On Track', 'Delayed', 'Blocked', 'Done'];

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Invitation = {
  id: string;
  email: string;
  role: string;
  invitation_code: string;
  invited_by?: string;
  accepted: boolean;
  expires_at: string;
  created_at: string;
};

export type User = {
  user_token: string;
  display_name: string;
  role: 'contractor' | 'admin' | 'developer' | 'project_manager';
  contractor_role?: string | null;
  created_at: string;
  last_active_at: string;
};

export type AuditLog = {
  id: string;
  user_token: string;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
};
