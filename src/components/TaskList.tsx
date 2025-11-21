import { memo, useMemo } from 'react';
import { Task } from '../types';
import { TaskListItem } from './TaskListItem';
import { Language } from '../lib/i18n';
import { isManagerRole } from '../lib/utils';
import { Session } from '../lib/session';

interface TaskListProps {
  tasks: Task[];
  currentRole: string;
  projectStart: string;
  projectEnd: string;
  onTaskView: (task: Task) => void;
  onTaskUpdate: (task: Task) => void;
  onTaskShift?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  language: Language;
  session: Session | null;
}

export const TaskList = memo(function TaskList({
  tasks,
  currentRole,
  projectStart,
  projectEnd,
  onTaskView,
  onTaskUpdate,
  onTaskShift,
  onTaskDelete,
  language,
  session,
}: TaskListProps) {
  const canManage = useMemo(() => isManagerRole(currentRole), [currentRole]);

  const filteredTasks = useMemo(() =>
    canManage ? tasks : tasks.filter(task => task.owner_roles.includes(currentRole)),
    [canManage, tasks, currentRole]
  );

  if (filteredTasks.length === 0) {
    return (
      <div className="card-modern p-12 text-center">
        <p className="text-slate-500 text-lg">No tasks found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredTasks.map((task) => (
        <TaskListItem
          key={task.id}
          task={task}
          currentRole={currentRole}
          projectStart={projectStart}
          projectEnd={projectEnd}
          onView={onTaskView}
          onUpdate={onTaskUpdate}
          onShift={onTaskShift}
          onDelete={onTaskDelete}
          language={language}
          session={session}
        />
      ))}
    </div>
  );
});
