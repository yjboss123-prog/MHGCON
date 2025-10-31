export type Role =
  | 'Developer'
  | 'Project Manager'
  | 'Construction Contractor'
  | 'Architect'
  | 'Chief of Plumbing'
  | 'Chief of Electronics';

export type TaskStatus = 'On Track' | 'Delayed' | 'Blocked' | 'Done';

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type Task = {
  id: string;
  project_id?: string | null;
  name: string;
  owner_role: Role;
  start_date: string;
  end_date: string;
  percent_done: number;
  status: TaskStatus;
  delay_reason?: string | null;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type Comment = {
  id: string;
  task_id: string;
  author_role: Role;
  message: string;
  created_at: string;
};

export type ProgressUpdate = {
  id: string;
  task_id: string;
  author_role: Role;
  percent_done: number;
  status: TaskStatus;
  delay_reason?: string | null;
  note?: string | null;
  photo_path?: string | null;
  photo_url?: string | null;
  created_at: string;
};

export const ROLES: Role[] = [
  'Developer',
  'Project Manager',
  'Construction Contractor',
  'Architect',
  'Chief of Plumbing',
  'Chief of Electronics',
];

export const TASK_STATUSES: TaskStatus[] = ['On Track', 'Delayed', 'Blocked', 'Done'];
