import { Task, Role } from '../types';
import {
  formatDate,
  getDaysRemaining,
  getStatusColor,
  getStatusBadgeColor,
  getRoleBadgeColor,
  calculateGanttPosition,
} from '../lib/utils';

interface TaskListItemProps {
  task: Task;
  currentRole: Role;
  projectStart: string;
  projectEnd: string;
  onView: (task: Task) => void;
  onUpdate: (task: Task) => void;
}

export function TaskListItem({
  task,
  currentRole,
  projectStart,
  projectEnd,
  onView,
  onUpdate,
}: TaskListItemProps) {
  const daysRemaining = getDaysRemaining(task.end_date);
  const canUpdate = task.owner_role === currentRole;
  const position = calculateGanttPosition(
    task.start_date,
    task.end_date,
    projectStart,
    projectEnd
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{task.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(task.owner_role)}`}>
                  {task.owner_role}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </div>
          </div>

          <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="absolute top-0 left-0 h-full"
              style={{ left: position.left, width: position.width }}
            >
              <div className={`h-full ${getStatusColor(task.status)} opacity-30`}></div>
              <div
                className={`absolute top-0 left-0 h-full ${getStatusColor(task.status)}`}
                style={{ width: `${task.percent_done}%` }}
              ></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-slate-700">
                {task.percent_done}%
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <span>
              {formatDate(task.start_date)} - {formatDate(task.end_date)}
            </span>
            {daysRemaining > 0 && (
              <span className="text-slate-500">
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
              </span>
            )}
            {daysRemaining < 0 && (
              <span className="text-red-600 font-medium">
                {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue
              </span>
            )}
          </div>

          {task.delay_reason && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <span className="font-medium">Delay reason:</span> {task.delay_reason}
            </div>
          )}
        </div>

        <div className="flex lg:flex-col gap-2">
          <button
            onClick={() => onView(task)}
            className="flex-1 lg:flex-none px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            View
          </button>
          {canUpdate && (
            <button
              onClick={() => onUpdate(task)}
              className="flex-1 lg:flex-none px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
