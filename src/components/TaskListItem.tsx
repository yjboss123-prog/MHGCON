import { memo, useMemo, useState, useCallback } from 'react';
import { Task } from '../types';
import { Calendar, Trash2, User } from 'lucide-react';
import {
  formatDate,
  getDaysRemaining,
  getStatusBadgeColor,
  getRoleBadgeColor,
  isManagerRole,
} from '../lib/utils';
import { Language, useTranslation, translateRole, translateStatus } from '../lib/i18n';
import { canOpenTask } from '../lib/api';
import { Session } from '../lib/session';
import { useDoubleTap } from '../lib/useDoubleTap';

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
  session: Session | null;
}

export const TaskListItem = memo(function TaskListItem({
  task,
  currentRole,
  onView,
  onUpdate,
  onShift,
  onDelete,
  language,
  session,
}: TaskListItemProps) {
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const daysRemaining = useMemo(() =>
    getDaysRemaining(task.end_date, task.status, task.percent_done),
    [task.end_date, task.status, task.percent_done]
  );

  const canManage = useMemo(() => isManagerRole(currentRole), [currentRole]);

  const checkAccess = useCallback(async () => {
    if (hasAccess !== null) return hasAccess;

    setIsCheckingAccess(true);
    try {
      const allowed = await canOpenTask(task.id, session);
      setHasAccess(allowed);
      return allowed;
    } catch (error) {
      console.error('Error checking task access:', error);
      setHasAccess(false);
      return false;
    } finally {
      setIsCheckingAccess(false);
    }
  }, [task.id, session, hasAccess]);


  const handleUpdate = useCallback(async () => {
    const allowed = await checkAccess();
    if (allowed) {
      onUpdate(task);
    }
  }, [checkAccess, onUpdate, task]);

  useMemo(() => {
    checkAccess();
  }, [checkAccess]);

  const dateRange = `${formatDate(task.start_date)} - ${formatDate(task.end_date)}`;
  const statusLabel = translateStatus(task.status, language);

  const daysText = language === 'fr'
    ? `${Math.abs(daysRemaining)} jour${Math.abs(daysRemaining) !== 1 ? 's' : ''} ${daysRemaining >= 0 ? 'restants' : 'de retard'}`
    : `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ${daysRemaining >= 0 ? 'remaining' : 'overdue'}`;

  const canShowButtons = hasAccess === true || canManage;

  const handleCardDoubleTap = useDoubleTap({
    onDoubleTap: handleUpdate
  });

  return (
    <article
      className="card-modern p-5 cursor-pointer group"
      onClick={handleCardDoubleTap}
      onDoubleClick={handleUpdate}
    >
      <h3 className="text-lg font-semibold text-slate-900">{task.name}</h3>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {task.owner_roles.map((role) => (
          <span key={role} className={`rounded-full px-3 py-1 ${getRoleBadgeColor(role)}`}>
            {translateRole(role, language)}
          </span>
        ))}
        <span className={`rounded-full px-3 py-1 ${getStatusBadgeColor(task.status)}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
          <div
            className="h-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 rounded-full"
            style={{ width: `${task.percent_done}%` }}
          />
        </div>
        <div className="mt-2 text-sm font-semibold text-slate-900">{task.percent_done}%</div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>{dateRange}</span>
        <span>• {daysText}</span>
        {task.assigned_display_name && (
          <span className="ml-auto rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 px-3 py-1.5 text-slate-700 text-sm inline-flex items-center gap-1.5 shadow-sm">
            <User className="w-3.5 h-3.5" />
            {task.assigned_display_name}
          </span>
        )}
      </div>

      {canShowButtons ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdate();
            }}
            disabled={isCheckingAccess}
            className="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-smooth text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
          >
            {language === 'fr' ? 'Mettre à jour' : 'Update'}
          </button>
          {canManage && onShift && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShift(task);
              }}
              className="h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-smooth flex items-center justify-center shadow-sm hover:shadow active:scale-95"
              title={language === 'fr' ? 'Décaler le planning' : 'Shift schedule'}
            >
              <Calendar className="w-5 h-5 text-slate-600" />
            </button>
          )}
          {canManage && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
              className="h-11 rounded-xl border border-red-300 bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200 transition-smooth flex items-center justify-center shadow-sm hover:shadow active:scale-95"
              title={language === 'fr' ? 'Supprimer' : 'Delete'}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdate();
            }}
            disabled={isCheckingAccess}
            className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {language === 'fr' ? 'Mettre à jour' : 'Update'}
          </button>
        </div>
      )}
    </article>
  );
});
