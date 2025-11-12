import { memo, useState, useCallback } from 'react';
import { Task } from '../types';
import { Calendar, Trash2, User } from 'lucide-react';
import { Language, useTranslation, translateRole, translateStatus } from '../lib/i18n';
import {
  formatDate,
  getDaysRemaining,
  getStatusBadgeColor,
  getRoleBadgeColor,
} from '../lib/utils';
import { canOpenTask } from '../lib/api';
import { Session } from '../lib/session';

interface MyDayViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusUpdate: (taskId: string, status: 'On Track' | 'Delayed' | 'Blocked' | 'Done') => void;
  language: Language;
  session: Session | null;
}

const getTaskPriority = (task: Task): 'today' | 'soon' | 'upcoming' => {
  if (!task.due_date) return 'upcoming';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(task.due_date);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'upcoming';
};

export const MyDayView = memo(function MyDayView({
  tasks,
  onTaskClick,
  language,
  session
}: MyDayViewProps) {
  const t = useTranslation(language);
  const [accessCache, setAccessCache] = useState<Record<string, boolean>>({});
  const [checkingAccess, setCheckingAccess] = useState<Record<string, boolean>>({});

  const tasksByPriority = {
    today: tasks.filter(t => getTaskPriority(t) === 'today' && t.status !== 'Done'),
    soon: tasks.filter(t => getTaskPriority(t) === 'soon' && t.status !== 'Done'),
    upcoming: tasks.filter(t => getTaskPriority(t) === 'upcoming' && t.status !== 'Done'),
  };

  const checkTaskAccess = useCallback(async (taskId: string) => {
    if (accessCache[taskId] !== undefined) {
      return accessCache[taskId];
    }

    setCheckingAccess(prev => ({ ...prev, [taskId]: true }));
    try {
      const hasAccess = await canOpenTask(taskId, session);
      setAccessCache(prev => ({ ...prev, [taskId]: hasAccess }));
      return hasAccess;
    } catch (error) {
      console.error('Error checking task access:', error);
      return false;
    } finally {
      setCheckingAccess(prev => ({ ...prev, [taskId]: false }));
    }
  }, [session, accessCache]);

  const handleView = useCallback(async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const hasAccess = await checkTaskAccess(task.id);
    if (hasAccess) {
      onTaskClick(task);
    }
  }, [checkTaskAccess, onTaskClick]);

  const handleUpdate = useCallback(async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const hasAccess = await checkTaskAccess(task.id);
    if (hasAccess) {
      onTaskClick(task);
    }
  }, [checkTaskAccess, onTaskClick]);

  const renderTaskCard = (task: Task) => {
    const daysRemaining = getDaysRemaining(task.end_date, task.status, task.percent_done);
    const dateRange = `${formatDate(task.start_date)} - ${formatDate(task.end_date)}`;
    const daysText = language === 'fr'
      ? `${Math.abs(daysRemaining)} jour${Math.abs(daysRemaining) !== 1 ? 's' : ''} ${daysRemaining >= 0 ? 'restants' : 'de retard'}`
      : `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ${daysRemaining >= 0 ? 'remaining' : 'overdue'}`;

    const hasAccess = accessCache[task.id];
    const isChecking = checkingAccess[task.id];

    if (hasAccess === undefined && !isChecking) {
      checkTaskAccess(task.id);
    }

    return (
      <article
        key={task.id}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <h3 className="text-lg font-semibold text-slate-900">{task.name}</h3>

        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {task.owner_roles.map((role) => (
            <span key={role} className={`rounded-full px-3 py-1 ${getRoleBadgeColor(role)}`}>
              {translateRole(role, language)}
            </span>
          ))}
          <span className={`rounded-full px-3 py-1 ${getStatusBadgeColor(task.status)}`}>
            {translateStatus(task.status, language)}
          </span>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-2 bg-emerald-500 transition-all duration-500"
              style={{ width: `${task.percent_done}%` }}
            />
          </div>
          <div className="mt-2 text-sm font-medium text-slate-900">{task.percent_done}%</div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <span>{dateRange}</span>
          <span>• {daysText}</span>
          {task.assigned_display_name && (
            <span className="ml-auto rounded-lg bg-slate-100 px-2 py-1 text-slate-700 text-sm inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {task.assigned_display_name}
            </span>
          )}
        </div>

        {hasAccess ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={(e) => handleView(task, e)}
              disabled={isChecking}
              className="h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {language === 'fr' ? 'Voir' : 'View'}
            </button>
            <button
              onClick={(e) => handleUpdate(task, e)}
              disabled={isChecking}
              className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {language === 'fr' ? 'Mettre à jour' : 'Update'}
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <button
              disabled
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-sm font-medium"
            >
              {language === 'fr' ? 'Voir' : 'View'}
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="pb-20">
      {tasksByPriority.today.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-lg font-bold text-slate-900">
              {language === 'fr' ? "Aujourd'hui" : 'Today'}
            </h2>
            <span className="text-sm font-semibold text-slate-500">
              ({tasksByPriority.today.length})
            </span>
          </div>
          <div className="space-y-4">
            {tasksByPriority.today.map(renderTaskCard)}
          </div>
        </div>
      )}

      {tasksByPriority.soon.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <h2 className="text-lg font-bold text-slate-900">
              {language === 'fr' ? 'Prochains jours' : 'Next 3 Days'}
            </h2>
            <span className="text-sm font-semibold text-slate-500">
              ({tasksByPriority.soon.length})
            </span>
          </div>
          <div className="space-y-4">
            {tasksByPriority.soon.map(renderTaskCard)}
          </div>
        </div>
      )}

      {tasksByPriority.upcoming.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
            <h2 className="text-lg font-bold text-slate-900">
              {language === 'fr' ? 'À venir' : 'Upcoming'}
            </h2>
            <span className="text-sm font-semibold text-slate-500">
              ({tasksByPriority.upcoming.length})
            </span>
          </div>
          <div className="space-y-4">
            {tasksByPriority.upcoming.map(renderTaskCard)}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {language === 'fr' ? 'Aucune tâche' : 'No tasks'}
          </h3>
          <p className="text-slate-600">
            {language === 'fr'
              ? 'Vous êtes à jour !'
              : "You're all caught up!"}
          </p>
        </div>
      )}
    </div>
  );
});
