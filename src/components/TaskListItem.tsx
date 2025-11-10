import { memo, useMemo } from 'react';
import { Task } from '../types';
import { Calendar, Trash2, ArrowRight } from 'lucide-react';
import {
  formatDate,
  getDaysRemaining,
  getStatusColor,
  getStatusBadgeColor,
  getRoleBadgeColor,
  calculateGanttPosition,
} from '../lib/utils';
import { Language, useTranslation, translateRole, translateStatus } from '../lib/i18n';

interface TaskListItemProps {
  task: Task;
  currentRole: string;
  projectStart: string;
  projectEnd: string;
  onView: (task: Task) => void;
  onUpdate: (task: Task) => void;
  onShift?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  language: Language;
}

export const TaskListItem = memo(function TaskListItem({
  task,
  currentRole,
  projectStart,
  projectEnd,
  onView,
  onUpdate,
  onShift,
  onDelete,
  language,
}: TaskListItemProps) {
  const t = useTranslation(language);

  const daysRemaining = useMemo(() =>
    getDaysRemaining(task.end_date, task.status, task.percent_done),
    [task.end_date, task.status, task.percent_done]
  );

  const canUpdate = useMemo(() =>
    task.owner_roles.includes(currentRole) || currentRole === 'Admin' || currentRole === 'Project Manager',
    [task.owner_roles, currentRole]
  );

  const canManage = useMemo(() =>
    currentRole === 'Project Manager' || currentRole === 'Developer',
    [currentRole]
  );

  const position = useMemo(() => calculateGanttPosition(
    task.start_date,
    task.end_date,
    projectStart,
    projectEnd
  ), [task.start_date, task.end_date, projectStart, projectEnd]);

  return (
    <div className={`card-modern p-4 sm:p-5 ${task.was_shifted ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-white' : ''}`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 break-words">{task.name}</h3>
                {task.was_shifted && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 animate-pulse flex-shrink-0"
                    title={language === 'fr' ? 'Planning décalé' : 'Schedule shifted'}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>{language === 'fr' ? 'DÉCALÉ' : 'SHIFTED'}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {task.owner_roles.map((role) => (
                  <span key={role} className={`badge-modern ${getRoleBadgeColor(role)}`}>
                    {translateRole(role, language)}
                  </span>
                ))}
                <span className={`badge-modern ${getStatusBadgeColor(task.status)}`}>
                  {translateStatus(task.status, language)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative h-10 bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl overflow-hidden mb-3 shadow-inner">
            <div
              className="absolute top-0 left-0 h-full"
              style={{ left: position.left, width: position.width }}
            >
              <div className={`h-full ${getStatusColor(task.status)} opacity-20`}></div>
              <div
                className={`absolute top-0 left-0 h-full ${getStatusColor(task.status)} shadow-lg`}
                style={{ width: `${task.percent_done}%` }}
              ></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-800 drop-shadow">
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
                {daysRemaining} {daysRemaining !== 1 ? t.daysRemaining : t.dayRemaining}
              </span>
            )}
            {daysRemaining < 0 && (
              <span className="text-red-600 font-medium">
                {Math.abs(daysRemaining)} {Math.abs(daysRemaining) !== 1 ? t.daysOverdue : t.dayOverdue}
              </span>
            )}
          </div>

          {task.delay_reason && canManage && (
            <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <span className="font-semibold">{t.delayReason}:</span> {task.delay_reason}
            </div>
          )}
        </div>

        <div className="flex lg:flex-col gap-2">
          <button
            onClick={() => onView(task)}
            className="btn-secondary flex-1 lg:flex-none px-4 py-2 text-sm"
          >
            {t.view}
          </button>
          {canUpdate && (
            <button
              onClick={() => onUpdate(task)}
              className="btn-primary flex-1 lg:flex-none px-4 py-2 text-sm"
            >
              {t.update}
            </button>
          )}
          {canManage && onShift && (
            <button
              onClick={() => onShift(task)}
              className="flex-1 lg:flex-none px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-xl border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 text-sm"
              title={language === 'fr' ? 'Décaler le planning' : 'Delay / Shift Schedule'}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden lg:inline">{t.shift}</span>
            </button>
          )}
          {canManage && onDelete && (
            <button
              onClick={() => onDelete(task)}
              className="flex-1 lg:flex-none px-4 py-2 bg-red-50 text-red-700 font-medium rounded-xl border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 text-sm"
              title={language === 'fr' ? 'Supprimer la tâche' : 'Delete Task'}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden lg:inline">{t.delete}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
