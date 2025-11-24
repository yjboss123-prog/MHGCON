import { memo, useState, useCallback, useEffect, useMemo, FC } from 'react';
import { Task, Project } from '../types';
import { Calendar, User, Settings, LogOut } from 'lucide-react';
import { Language, translateRole, translateStatus } from '../lib/i18n';
import {
  formatDate,
  getDaysRemaining,
  getStatusBadgeColor,
  getRoleBadgeColor,
} from '../lib/utils';
import { Session } from '../lib/session';
import { useDoubleTap } from '../lib/useDoubleTap';
import { ProjectSwitcherModal } from './ProjectSwitcherModal';

interface TaskCardProps {
  id: string;
  name: string;
  roleLabels: string[];
  roleBadgeColors: string[];
  statusLabel: string;
  statusBadgeColor: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  daysText: string;
  progressPct: number;
  assignee?: string;
  viewLabel: string;
  updateLabel: string;
  onView: (id: string) => void;
}

const TaskCard: FC<TaskCardProps> = memo(({
  id, name, roleLabels, roleBadgeColors, statusLabel, statusBadgeColor,
  startDate, endDate, daysText, progressPct, assignee, viewLabel: _viewLabel, updateLabel, onView
}) => {
  const handleCardDoubleTap = useDoubleTap({
    onDoubleTap: () => onView(id)
  });

  return (
    <article
      className="rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer"
      onClick={handleCardDoubleTap}
      onDoubleClick={() => onView(id)}
    >
      <h3 className="text-lg font-semibold text-slate-900">{name}</h3>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {roleLabels.map((role, idx) => (
          <span key={role} className={`rounded-full px-3 py-1 ${roleBadgeColors[idx]}`}>
            {role}
          </span>
        ))}
        <span className={`rounded-full px-3 py-1 ${statusBadgeColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-2 bg-emerald-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-2 text-sm font-medium text-slate-900">{progressPct}%</div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>{startDate} - {endDate}</span>
        <span>• {daysText}</span>
        {assignee && (
          <span className="ml-auto rounded-lg bg-slate-100 px-2 py-1 text-slate-700 text-sm inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {assignee}
          </span>
        )}
      </div>

      <div className="mt-4">
        <button
          onClick={() => onView(id)}
          className="w-full h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 text-sm font-medium"
        >
          {updateLabel}
        </button>
      </div>
    </article>
  );
}, (prev, next) => {
  return prev.id === next.id &&
    prev.name === next.name &&
    prev.progressPct === next.progressPct &&
    prev.statusLabel === next.statusLabel &&
    prev.assignee === next.assignee;
});

interface MyDayViewProps {
  tasks: Task[];
  allTasks?: Task[];
  onTaskClick: (task: Task) => void;
  onStatusUpdate: (taskId: string, status: 'On Track' | 'Delayed' | 'Blocked' | 'Done') => void;
  language: Language;
  session: Session | null;
  currentProject?: Project;
  allProjects?: Project[];
  onProjectChange?: (projectId: string) => void;
  onSettings?: () => void;
  onLogout?: () => void;
  isProjectSwitcherOpen?: boolean;
  onProjectSwitcherClose?: () => void;
}

const getTaskPriority = (task: Task): 'today' | 'soon' | 'upcoming' => {
  if (!task.end_date) return 'upcoming';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(task.end_date);
  endDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'upcoming';
};

export const MyDayView = memo(function MyDayView({
  tasks,
  allTasks = [],
  onTaskClick,
  language,
  session,
  currentProject,
  allProjects = [],
  onProjectChange,
  onSettings,
  onLogout,
  isProjectSwitcherOpen = false,
  onProjectSwitcherClose
}: MyDayViewProps) {
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

  const handleViewTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) onTaskClick(task);
  }, [tasks, onTaskClick]);

  const renderTaskCard = useCallback((task: Task) => {
    const daysRemaining = getDaysRemaining(task.end_date, task.status, task.percent_done);
    const daysText = language === 'fr'
      ? `${Math.abs(daysRemaining)} jour${Math.abs(daysRemaining) !== 1 ? 's' : ''} ${daysRemaining >= 0 ? 'restants' : 'de retard'}`
      : `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ${daysRemaining >= 0 ? 'remaining' : 'overdue'}`;

    return (
      <TaskCard
        key={task.id}
        id={task.id}
        name={task.name}
        roleLabels={task.owner_roles.map(r => translateRole(r, language))}
        roleBadgeColors={task.owner_roles.map(r => getRoleBadgeColor(r))}
        statusLabel={translateStatus(task.status, language)}
        statusBadgeColor={getStatusBadgeColor(task.status)}
        startDate={formatDate(task.start_date)}
        endDate={formatDate(task.end_date)}
        daysRemaining={daysRemaining}
        daysText={daysText}
        progressPct={task.percent_done}
        assignee={task.assigned_display_name}
        viewLabel={language === 'fr' ? 'Voir' : 'View'}
        updateLabel={language === 'fr' ? 'Mettre à jour' : 'Update'}
        onView={handleViewTask}
      />
    );
  }, [language, tasks, handleViewTask]);

  return (
    <div className="myday-view-wrapper flex flex-col min-h-[100dvh]">
      {onProjectChange && onProjectSwitcherClose && (
        <ProjectSwitcherModal
          isOpen={isProjectSwitcherOpen}
          onClose={onProjectSwitcherClose}
          currentProject={currentProject}
          allProjects={allProjects}
          tasks={allTasks}
          onProjectChange={onProjectChange}
          session={session}
        />
      )}

      <div className={`main-list relative z-[15] ${isMobile ? "pb-[calc(96px+env(safe-area-inset-bottom))]" : "pb-20"}`}>
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
          className="bottom-actions-bar fixed inset-x-0 bottom-0 z-[1200] bg-white/95 border-t border-slate-200 px-4 pt-2"
          style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', pointerEvents: 'auto' }}
        >
          <div className="mx-auto max-w-screen-sm grid grid-cols-2 gap-3">
            <button
              onClick={onSettings}
              className="h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {language === 'fr' ? 'Réglages' : 'Settings'}
            </button>
            <button
              onClick={onLogout}
              className="h-11 rounded-xl bg-red-600 text-white hover:bg-red-700 active:bg-red-800 text-sm font-medium flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {language === 'fr' ? 'Se déconnecter' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
