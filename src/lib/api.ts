import { supabase } from './supabase';
import { Task, Comment, ProgressUpdate, Role, TaskStatus } from '../types';
import { seedTasks } from './seedData';

let isInitialized = false;

export async function initializeData() {
  if (isInitialized) return;

  try {
    const { count, error: countError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Database error: ${countError.message}`);
    }

    if (count === 0) {
      const { error } = await supabase.from('tasks').insert(seedTasks);
      if (error) {
        throw new Error(`Failed to seed database: ${error.message}`);
      }
    }

    isInitialized = true;
  } catch (error) {
    console.error('initializeData error:', error);
    throw error;
  }
}

export async function getTasks(projectId?: string): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .order('start_date', { ascending: true });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

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

  const { data: project } = await supabase
    .from('projects')
    .select('project_current_date')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  if (project?.project_current_date) {
    const newCurrentDate = new Date(project.project_current_date);
    newCurrentDate.setDate(newCurrentDate.getDate() + deltaDays);

    await supabase
      .from('projects')
      .update({
        project_current_date: newCurrentDate.toISOString().slice(0, 10),
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000001');
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
  description: string,
  customContractors: string[],
  currentDate?: string
) {
  const updateData: any = {
    name,
    description,
    custom_contractors: customContractors,
    updated_at: new Date().toISOString(),
  };

  if (currentDate !== undefined) {
    updateData.project_current_date = currentDate;
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInvitations() {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createInvitation(email: string, role: string) {
  const { data, error } = await supabase
    .from('invitations')
    .insert([{
      email,
      role
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function validateInvitationCode(code: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('invitation_code', code)
    .eq('accepted', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return getProfile(user.id);
}

export async function updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllProjects(includeArchived: boolean = false) {
  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (!includeArchived) {
    query = query.eq('archived', false);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function createProject(name: string, description: string) {
  const { data, error } = await supabase
    .from('projects')
    .insert([{
      name,
      description,
      start_date: '2026-01-06',
      end_date: '2026-12-31',
      custom_contractors: [],
      archived: false,
      project_current_date: '2026-01-06'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function duplicateProject(sourceProjectId: string) {
  const sourceProject = await getProject(sourceProjectId);

  const newProject = await createProject(
    `Copy of ${sourceProject.name}`,
    sourceProject.description
  );

  const { data: sourceTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', sourceProjectId);

  if (sourceTasks && sourceTasks.length > 0) {
    const newTasks = sourceTasks.map(task => ({
      name: task.name,
      owner_roles: task.owner_roles,
      start_date: task.start_date,
      end_date: task.end_date,
      percent_done: 0,
      status: 'On Track',
      delay_reason: null,
      project_id: newProject.id,
      was_shifted: false,
      last_shift_date: null
    }));

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(newTasks);

    if (tasksError) console.error('Error duplicating tasks:', tasksError);
  }

  return newProject;
}

export async function archiveProject(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unarchiveProject(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .update({ archived: false, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(projectId: string) {
  await supabase.from('tasks').delete().eq('project_id', projectId);

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}
