import { supabase } from './supabase';
import { Task, Comment, ProgressUpdate, Role, TaskStatus } from '../types';
import { seedTasks } from './seedData';

export async function initializeData() {
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  if (count === 0) {
    const { error } = await supabase.from('tasks').insert(seedTasks);
    if (error) {
      console.error('Error seeding data:', error);
    }
  }
}

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createComment(taskId: string, authorRole: Role, message: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert([{ task_id: taskId, author_role: authorRole, message }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProgressUpdates(taskId: string): Promise<ProgressUpdate[]> {
  const { data, error } = await supabase
    .from('progress_updates')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProgressUpdate(
  taskId: string,
  authorRole: Role,
  percentDone: number,
  status: TaskStatus,
  delayReason?: string,
  note?: string,
  photoBase64?: string
) {
  const { data, error } = await supabase
    .from('progress_updates')
    .insert([
      {
        task_id: taskId,
        author_role: authorRole,
        percent_done: percentDone,
        status,
        delay_reason: delayReason,
        note,
        photo_base64: photoBase64,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  await updateTask(taskId, {
    percent_done: percentDone,
    status,
    delay_reason: delayReason,
  });

  return data;
}
