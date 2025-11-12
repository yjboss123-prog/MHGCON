import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { Task, Project } from '../types';
import { Calendar, Trash2, User, Settings, LogOut } from 'lucide-react';
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
  currentProject?: Project;
  allProjects?: Project[];
  onProjectChange?: (projectId: string) => void;
  onSettings?: () => void;
  onLogout?: () => void;
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
  session,
  currentProject,
  allProjects = [],
  onProjectChange,
  onSettings,
  onLogout
}: MyDayViewProps) {
  const t = useTranslation(language);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 640px)").matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tasksByPriority = useMemo(() => ({
    today: tasks.filter(t => getTaskPriority(t) === 'today' && t.status !== 'Done'),
    soon: tasks.filter(t => getTaskPriority(t) === 'soon' && t.status !== 'Done'),
    upcoming: tasks.filter(t => getTaskPriority(t) === 'upcoming' && t.status !== 'Done'),
  }), [tasks]);

  const handleTaskClick = useCallback((task: Task) => {
    onTaskClick(task);
  }, [onTaskClick]);

  const renderTaskCard = useCallback((task: Task) => {
    const daysRemaining = getDaysRemaining(task.end_date, task.status, task.percent_done);
    const dateRange = `${formatDate(task.start_date)} - ${formatDate(task.end_date)}`;
    const daysText = language === 'fr'
      ? `${Math.abs(daysRemaining)} jour${Math.abs(daysRemaining) !== 1 ? 's' : ''} ${daysRemaining >= 0 ? 'restants' : 'de retard'}`
      : `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ${daysRemaining >= 0 ? 'remaining' : 'overdue'}`;

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

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => handleTaskClick(task)}
            className="h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            {language === 'fr' ? 'Voir' : 'View'}
          </button>
          <button
            onClick={() => handleTaskClick(task)}
            className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            {language === 'fr' ? 'Mettre à jour' : 'Update'}
          </button>
        </div>
      </article>
    );
  }, [language, handleTaskClick]);

  return (
    <>
      {isMobile && allProjects.length > 0 && onProjectChange && (
        <div className="mb-4 px-1">
          <div className="grid grid-cols-2 gap-3">
            {allProjects.slice(0, 2).map((project) => (
              <button
                key={project.id}
                onClick={() => onProjectChange(project.id)}
                className={`h-10 rounded-xl border text-sm font-medium transition-colors ${
                  project.id === currentProject?.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                {project.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={isMobile ? "pb-[calc(96px+env(safe-area-inset-bottom))]" : "pb-20"}>
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
            {tasksByPriority.today.map((task) => renderTaskCard(task))}
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
            {tasksByPriority.soon.map((task) => renderTaskCard(task))}
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
            {tasksByPriority.upcoming.map((task) => renderTaskCard(task))}
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

      {isMobile && onSettings && onLogout && (
        <div
          className="fixed inset-x-0 bottom-0 z-[1200] bg-white/95 backdrop-blur border-t border-slate-200 px-4 pt-2"
          style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto max-w-screen-sm grid grid-cols-2 gap-3">
            <button
              onClick={onSettings}
              className="h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {language === 'fr' ? 'Réglages' : 'Settings'}
            </button>
            <button
              onClick={onLogout}
              className="h-11 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {language === 'fr' ? 'Se déconnecter' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </>
  );
});
