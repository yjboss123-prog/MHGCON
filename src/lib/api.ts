import { supabase } from './supabase';
import { Task, Comment, ProgressUpdate, Role, TaskStatus } from '../types';
import { seedTasks } from './seedData';

export async function initializeData() {
  try {
    const { count, error: countError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error checking task count:', countError);
      throw new Error(`Database error: ${countError.message}`);
    }

    if (count === 0) {
      console.log('No tasks found, seeding database...');
      const { error } = await supabase.from('tasks').insert(seedTasks);
      if (error) {
        console.error('Error seeding data:', error);
        throw new Error(`Failed to seed database: ${error.message}`);
      }
      console.log('Database seeded successfully');
    } else {
      console.log(`Found ${count} existing tasks`);
    }
  } catch (error) {
    console.error('initializeData error:', error);
    throw error;
  }
}

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
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

export async function getWeekWork(
  taskId: string,
  year: number,
  week: number
): Promise<{ work_description: string; photos: string[] } | null> {
  const { data, error } = await supabase
    .from('task_weeks')
    .select('work_description, photos')
    .eq('task_id', taskId)
    .eq('year', year)
    .eq('week_number', week)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveWeekWork(
  taskId: string,
  year: number,
  week: number,
  workDescription: string,
  photos: string[]
) {
  const { data, error } = await supabase
    .from('task_weeks')
    .upsert(
      {
        task_id: taskId,
        year,
        week_number: week,
        work_description: workDescription,
        photos,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'task_id,year,week_number',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function shiftSchedule(
  anchorTask: Task,
  amount: number,
  unit: 'Days' | 'Weeks',
  skipDone: boolean
): Promise<{ shiftedCount: number }> {
  const shiftDays = amount * (unit === 'Weeks' ? 7 : 1);

  const { data: allTasks, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .order('start_date', { ascending: true });

  if (fetchError) throw fetchError;

  const anchorEndDate = new Date(anchorTask.end_date);

  let toShift = allTasks.filter((t) => {
    if (t.id === anchorTask.id) return false;
    const taskStartDate = new Date(t.start_date);
    return taskStartDate >= anchorEndDate;
  });

  if (skipDone) {
    toShift = toShift.filter((t) => t.status !== 'Done');
  }

  if (toShift.length === 0) {
    return { shiftedCount: 0 };
  }

  for (const t of toShift) {
    const newStartDate = new Date(t.start_date);
    newStartDate.setDate(newStartDate.getDate() + shiftDays);
    const newEndDate = new Date(t.end_date);
    newEndDate.setDate(newEndDate.getDate() + shiftDays);

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        start_date: newStartDate.toISOString().slice(0, 10),
        end_date: newEndDate.toISOString().slice(0, 10),
        was_shifted: true,
        last_shift_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', t.id);

    if (updateError) throw updateError;
  }

  const currentDate = new Date().toISOString().slice(0, 10);
  const comments = toShift.map((t) => ({
    task_id: t.id,
    author_role: 'Project Manager',
    message: `Auto-shifted by ${amount} ${unit} due to delay of "${anchorTask.name}" on ${currentDate}.`,
  }));

  const { error: commentError } = await supabase.from('comments').insert(comments);

  if (commentError) throw commentError;

  return { shiftedCount: toShift.length };
}

export async function rebaselineProject(
  newBaselineStart: string,
  resetStatuses: boolean,
  clearDelayReasons: boolean
): Promise<{ shiftedCount: number; deltaDays: number }> {
  const { data: allTasks, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .order('start_date', { ascending: true });

  if (fetchError) throw fetchError;

  if (allTasks.length === 0) {
    return { shiftedCount: 0, deltaDays: 0 };
  }

  const minStart = allTasks.reduce((min, task) => {
    return task.start_date < min ? task.start_date : min;
  }, allTasks[0].start_date);

  const deltaDays = Math.round(
    (new Date(newBaselineStart).getTime() - new Date(minStart).getTime()) / 86400000
  );

  if (deltaDays === 0) {
    return { shiftedCount: 0, deltaDays: 0 };
  }

  for (const t of allTasks) {
    const newStartDate = new Date(t.start_date);
    newStartDate.setDate(newStartDate.getDate() + deltaDays);
    const newEndDate = new Date(t.end_date);
    newEndDate.setDate(newEndDate.getDate() + deltaDays);

    const update: any = {
      start_date: newStartDate.toISOString().slice(0, 10),
      end_date: newEndDate.toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    };

    if (resetStatuses && t.status !== 'Done') {
      update.status = 'On Track';
      if (clearDelayReasons) {
        update.delay_reason = null;
      }
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update(update)
      .eq('id', t.id);

    if (updateError) throw updateError;
  }

  const comment = {
    task_id: allTasks[0].id,
    author_role: 'Project Manager',
    message: `Rebaseline applied: shifted ${deltaDays} days from ${minStart} to ${newBaselineStart}.`,
  };

  const { error: commentError } = await supabase.from('comments').insert([comment]);

  if (commentError) console.error('Error adding rebaseline comment:', commentError);

  return { shiftedCount: allTasks.length, deltaDays };
}

export async function getProject(projectId: string = '00000000-0000-0000-0000-000000000001') {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(
  projectId: string,
  name: string,
  description: string
) {
  const { data, error } = await supabase
    .from('projects')
    .update({
      name,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
