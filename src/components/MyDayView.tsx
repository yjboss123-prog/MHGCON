import { memo, useState } from 'react';
import { Task } from '../types';
import { Calendar, Clock, Camera, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react';
import { Language, useTranslation } from '../lib/i18n';

interface MyDayViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusUpdate: (taskId: string, status: 'On Track' | 'Delayed' | 'Blocked' | 'Done') => void;
  language: Language;
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Done':
      return 'bg-emerald-500';
    case 'On Track':
      return 'bg-blue-500';
    case 'Delayed':
      return 'bg-amber-500';
    case 'Blocked':
      return 'bg-red-500';
    default:
      return 'bg-slate-400';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Done':
      return CheckCircle;
    case 'On Track':
      return Play;
    case 'Blocked':
      return AlertCircle;
    default:
      return Clock;
  }
};

export const MyDayView = memo(function MyDayView({ tasks, onTaskClick, onStatusUpdate, language }: MyDayViewProps) {
  const t = useTranslation(language);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const tasksByPriority = {
    today: tasks.filter(t => getTaskPriority(t) === 'today' && t.status !== 'Done'),
    soon: tasks.filter(t => getTaskPriority(t) === 'soon' && t.status !== 'Done'),
    upcoming: tasks.filter(t => getTaskPriority(t) === 'upcoming' && t.status !== 'Done'),
  };

  const getNextAction = (task: Task) => {
    if (task.status === 'Done') return null;
    if (task.status === 'Blocked') return 'resume';
    if (task.percent_done === 0) return 'start';
    if (task.percent_done === 100) return 'complete';
    return 'continue';
  };

  const handleQuickAction = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const action = getNextAction(task);

    if (action === 'start') {
      onStatusUpdate(task.id, 'On Track');
    } else if (action === 'complete') {
      onStatusUpdate(task.id, 'Done');
    } else if (action === 'resume') {
      onStatusUpdate(task.id, 'On Track');
    }
  };

  const renderTaskCard = (task: Task) => {
    const StatusIcon = getStatusIcon(task.status);
    const nextAction = getNextAction(task);
    const isExpanded = expandedTask === task.id;

    return (
      <div
        key={task.id}
        className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden active:scale-[0.98] transition-transform"
        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
      >
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${getStatusColor(task.status)}`}>
              <StatusIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-slate-900 mb-1 leading-snug">
                {task.name}
              </h3>
              {task.due_date && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(task.due_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short'
                  })}</span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  {task.percent_done}%
                </div>
                <div className="text-xs text-slate-500">
                  {language === 'fr' ? 'Fait' : 'Done'}
                </div>
              </div>
            </div>
          </div>

          {task.trade && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 mb-3">
              {task.trade}
            </div>
          )}

          {isExpanded && task.delay_reason && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900">{task.delay_reason}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {nextAction && (
              <button
                onClick={(e) => handleQuickAction(task, e)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-white transition-all active:scale-95 ${
                  nextAction === 'complete'
                    ? 'bg-emerald-500 active:bg-emerald-600'
                    : 'bg-blue-500 active:bg-blue-600'
                }`}
                style={{ minHeight: '48px' }}
              >
                {nextAction === 'start' && (
                  <>
                    <Play className="w-5 h-5" />
                    <span>{language === 'fr' ? 'Commencer' : 'Start'}</span>
                  </>
                )}
                {nextAction === 'continue' && (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>{language === 'fr' ? 'Continuer' : 'Continue'}</span>
                  </>
                )}
                {nextAction === 'complete' && (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>{language === 'fr' ? 'Terminer' : 'Complete'}</span>
                  </>
                )}
                {nextAction === 'resume' && (
                  <>
                    <Play className="w-5 h-5" />
                    <span>{language === 'fr' ? 'Reprendre' : 'Resume'}</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick(task);
              }}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold bg-slate-100 text-slate-700 active:bg-slate-200 transition-all active:scale-95"
              style={{ minHeight: '48px' }}
            >
              <Camera className="w-5 h-5" />
              <span className="hidden sm:inline">{language === 'fr' ? 'Photo' : 'Photo'}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(task.id, 'Blocked');
              }}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold bg-red-50 text-red-700 active:bg-red-100 transition-all active:scale-95"
              style={{ minHeight: '48px' }}
            >
              <AlertCircle className="w-5 h-5" />
              <span className="hidden sm:inline">{language === 'fr' ? 'Bloqué' : 'Block'}</span>
            </button>
          </div>
        </div>

        {task.percent_done > 0 && task.percent_done < 100 && (
          <div className="h-2 bg-slate-100">
            <div
              className={`h-full ${getStatusColor(task.status)} transition-all duration-300`}
              style={{ width: `${task.percent_done}%` }}
            />
          </div>
        )}
      </div>
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
          <div className="space-y-3">
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
          <div className="space-y-3">
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
          <div className="space-y-3">
            {tasksByPriority.upcoming.map(renderTaskCard)}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
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
