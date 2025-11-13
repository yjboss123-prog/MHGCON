import { Session } from './session';
import { Task } from '../types';

export function canViewProjectBudget(session: Session | null): boolean {
  if (!session) return false;
  return session.role === 'admin' ||
         session.role === 'developer' ||
         session.role === 'project_manager';
}

export function canViewTaskBudget(
  session: Session | null,
  task: Task | null
): boolean {
  if (!session || !task) return false;

  if (session.role === 'admin' ||
      session.role === 'developer' ||
      session.role === 'project_manager') {
    return true;
  }

  if (session.role === 'contractor') {
    return task.assigned_user_token === session.user_token;
  }

  return false;
}
