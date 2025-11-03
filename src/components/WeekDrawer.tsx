import { useEffect, useMemo, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { TaskRow, getUpdatesForTasks } from '../services/db';
import { GanttWeek } from './GanttChart';
import { ProgressUpdate } from '../types';
import { formatRelativeTime, getRoleBadgeColor, getStatusBadgeColor } from '../lib/utils';

interface WeekDrawerProps {
  week: GanttWeek | null;
  tasks: TaskRow[];
  isOpen: boolean;
  onClose: () => void;
  onTaskView: (task: TaskRow) => void;
  onTaskUpdate: (task: TaskRow) => void;
  canRecordProgress: boolean;
}

export function WeekDrawer({
  week,
  tasks,
  isOpen,
  onClose,
  onTaskView,
  onTaskUpdate,
  canRecordProgress,
}: WeekDrawerProps) {
  const [updatesByTask, setUpdatesByTask] = useState<Record<string, ProgressUpdate[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUpdates() {
      if (!week || !isOpen || tasks.length === 0) {
        setIsLoading(false);
        setUpdatesByTask({});
        return;
      }

      setIsLoading(true);
      try {
        const uniqueTaskIds = Array.from(new Set(tasks.map((task) => task.id)));
        const map = await getUpdatesForTasks(uniqueTaskIds);

        if (!isMounted) return;

        setUpdatesByTask(map);
      } catch (error) {
        console.error('Failed to load updates for week view:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUpdates();

    return () => {
      isMounted = false;
    };
  }, [week, tasks, isOpen]);

  const filteredUpdates = useMemo(() => {
    if (!week) return {} as Record<string, ProgressUpdate[]>;

    const start = new Date(week.startDate).getTime();
    const end = new Date(week.endDate).getTime();

    return Object.fromEntries(
      Object.entries(updatesByTask).map(([taskId, updates]) => {
        const withinWeek = updates.filter((update) => {
          const created = new Date(update.created_at).getTime();
          return created >= start && created <= end;
        });
        return [taskId, withinWeek];
      })
    );
  }, [updatesByTask, week]);

  if (!isOpen || !week) {
    return null;
  }

  const weekRange = `${new Date(week.startDate).toLocaleDateString()} – ${new Date(
    week.endDate
  ).toLocaleDateString()}`;

  const hasTasks = tasks.length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-white z-50 shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Week overview</p>
            <h2 className="text-lg font-semibold text-slate-900">
              {week.label} · {weekRange}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!hasTasks ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No tasks scheduled during this week.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const updates = filteredUpdates[task.id] ?? [];

                return (
                  <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">{task.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className={`inline-flex items-center rounded px-2 py-0.5 font-medium ${getRoleBadgeColor(task.owner_role)}`}>
                            {task.owner_role}
                          </span>
                          <span className={`inline-flex items-center rounded px-2 py-0.5 font-medium ${getStatusBadgeColor(task.status)}`}>
                            {task.status} · {task.percent_done}%
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <p>
                          {new Date(task.start_date).toLocaleDateString()} – {new Date(task.end_date).toLocaleDateString()}
                        </p>
                        {task.delay_reason && (
                          <p className="mt-1 text-amber-700">Delay: {task.delay_reason}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">Updates this week</span>
                          {isLoading && <span className="text-xs text-slate-400">Refreshing...</span>}
                        </div>
                        {updates.length === 0 ? (
                          <p className="text-xs text-slate-500">No recorded updates during this week.</p>
                        ) : (
                          <ul className="space-y-2 text-xs text-slate-600">
                            {updates.map((update) => (
                              <li
                                key={update.id}
                                className="rounded-lg bg-white px-3 py-2 shadow-inner ring-1 ring-slate-200"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className={`inline-flex items-center rounded px-2 py-0.5 font-medium ${getStatusBadgeColor(update.status)}`}>
                                    {update.status} · {update.percent_done}%
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {formatRelativeTime(update.created_at)}
                                  </span>
                                </div>
                                {update.delay_reason && (
                                  <p className="mt-1 text-[11px] text-amber-700">
                                    Delay reason: {update.delay_reason}
                                  </p>
                                )}
                                {update.note && (
                                  <p className="mt-1 text-[11px] text-slate-600">Note: {update.note}</p>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onTaskView(task)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          View full task
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        {canRecordProgress && (
                          <button
                            type="button"
                            onClick={() => onTaskUpdate(task)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                          >
                            Record update
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
