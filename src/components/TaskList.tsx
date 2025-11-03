import { Task } from '../types';
import { TaskListItem } from './TaskListItem';
import { Language } from '../lib/i18n';

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
}

export function TaskList({
  tasks,
  currentRole,
  projectStart,
  projectEnd,
  onTaskView,
  onTaskUpdate,
  onTaskShift,
  onTaskDelete,
  language,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-slate-500">No tasks found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
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
        />
      ))}
    </div>
  );
}
