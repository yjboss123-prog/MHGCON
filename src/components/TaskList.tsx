import { Task, Role } from '../types';
import { TaskListItem } from './TaskListItem';

interface TaskListProps {
  tasks: Task[];
  currentRole: Role;
  projectStart: string;
  projectEnd: string;
  onTaskView: (task: Task) => void;
  onTaskUpdate: (task: Task) => void;
}

export function TaskList({
  tasks,
  currentRole,
  projectStart,
  projectEnd,
  onTaskView,
  onTaskUpdate,
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
        />
      ))}
    </div>
  );
}
