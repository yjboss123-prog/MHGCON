export type Role =
  | 'Developer'
  | 'Project Manager'
  | 'Construction Contractor'
  | 'Architect'
  | 'Chief of Plumbing'
  | 'Chief of Electronics';

export type TaskStatus = 'On Track' | 'Delayed' | 'Blocked' | 'Done';

export type Task = {
  id: string;
  name: string;
  owner_role: Role;
  start_date: string;
  end_date: string;
  percent_done: number;
  status: TaskStatus;
  delay_reason?: string;
  created_at: string;
  updated_at: string;
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
  delay_reason?: string;
  note?: string;
  photo_base64?: string;
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
