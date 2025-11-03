import { getSupabaseClient } from '../lib/supabase';
import { Comment, ProgressUpdate, Project, Role, Task, TaskStatus } from '../types';
import { getPublicUrl } from './storage';

export type ProjectRow = Project;

export type TaskRow = Task & {
  project_id: string;
};

export type UpdateRow = {
  id: string;
  task_id: string;
  author_role: Role;
  percent_done: number;
  status: TaskStatus;
  delay_reason: string | null;
  note: string | null;
  photo_path: string | null;
  created_at: string;
};

export type CommentRow = Comment;

export async function getFirstProject(): Promise<ProjectRow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProjectRow | null;
}

export async function getTasks(projectId: string): Promise<TaskRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('start_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TaskRow[];
}

interface CreateTaskInput {
  projectId: string;
  name: string;
  ownerRole: Role;
  startDate: string;
  endDate: string;
}

export async function createTask({
  projectId,
  name,
  ownerRole,
  startDate,
  endDate,
}: CreateTaskInput): Promise<TaskRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        project_id: projectId,
        name,
        owner_role: ownerRole,
        start_date: startDate,
        end_date: endDate,
        percent_done: 0,
        status: 'On Track',
      },
    ])
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TaskRow;
}

export interface SaveProgressUpdateInput {
  taskId: string;
  authorRole: Role;
  percent: number;
  status: TaskStatus;
  delayReason?: string;
  note?: string;
  photoPath?: string;
}

function normalizeUpdate(row: UpdateRow): ProgressUpdate {
  return {
    id: row.id,
    task_id: row.task_id,
    author_role: row.author_role,
    percent_done: row.percent_done,
    status: row.status,
    delay_reason: row.delay_reason,
    note: row.note,
    photo_path: row.photo_path ?? undefined,
    photo_url: row.photo_path ? getPublicUrl(row.photo_path) : undefined,
    created_at: row.created_at,
  };
}

export async function saveProgressUpdate({
  taskId,
  authorRole,
  percent,
  status,
  delayReason,
  note,
  photoPath,
}: SaveProgressUpdateInput): Promise<ProgressUpdate> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('updates')
    .insert([
      {
        task_id: taskId,
        author_role: authorRole,
        percent_done: percent,
        status,
        delay_reason: delayReason ?? null,
        note: note ?? null,
        photo_path: photoPath ?? null,
      },
    ])
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const updateRow = data as UpdateRow;

  const { error: taskError } = await supabase
    .from('tasks')
    .update({
      percent_done: percent,
      status,
      delay_reason: delayReason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (taskError) {
    throw new Error(taskError.message);
  }

  return normalizeUpdate(updateRow);
}

export async function getUpdates(taskId: string): Promise<ProgressUpdate[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as UpdateRow[];
  return rows.map(normalizeUpdate);
}

export async function getUpdatesForTasks(
  taskIds: string[]
): Promise<Record<string, ProgressUpdate[]>> {
  if (taskIds.length === 0) {
    return {};
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .in('task_id', taskIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const grouped: Record<string, ProgressUpdate[]> = {};
  const rows = (data ?? []) as UpdateRow[];

  for (const row of rows) {
    const normalized = normalizeUpdate(row);
    if (!grouped[normalized.task_id]) {
      grouped[normalized.task_id] = [];
    }
    grouped[normalized.task_id].push(normalized);
  }

  return grouped;
}

export async function getComments(taskId: string): Promise<CommentRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CommentRow[];
}

export async function addComment(taskId: string, authorRole: Role, message: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        task_id: taskId,
        author_role: authorRole,
        message,
      },
    ])
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CommentRow;
}
