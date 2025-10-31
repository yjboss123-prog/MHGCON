import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { TaskRow } from '../services/db';
import { getRoleBadgeColor, getStatusBadgeColor, getStatusColor } from '../lib/utils';

export const PRIMARY_TASK_ORDER = [
  'Installation de chantier',
  'Terrassement',
  'Fondations production',
  'Charpente métallique',
  'Couverture et bardage',
  'Dallage',
  'Fondations administration/social',
  'Élévation',
  'Plancher',
  'Équipements industriels',
  'Lots architecturaux',
  'Lots techniques',
  'Aménagement extérieur',
] as const;

export type PrimaryTaskName = (typeof PRIMARY_TASK_ORDER)[number];

const TASK_COLUMN_WIDTH = 280;
const WEEK_COLUMN_MIN_WIDTH = 80;

export type GanttWeek = {
  index: number;
  label: string;
  startDate: string;
  endDate: string;
  monthLabel: string;
};

interface MonthSegment {
  label: string;
  span: number;
}

interface GanttChartProps {
  tasks: TaskRow[];
  projectStart: string;
  projectEnd: string;
  canRecordProgress: boolean;
  onTaskView: (task: TaskRow) => void;
  onTaskUpdate: (task: TaskRow) => void;
  onWeekSelect: (week: GanttWeek) => void;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day + 6) % 7; // Monday as first day of week
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

function generateWeeks(projectStart: string, projectEnd: string): GanttWeek[] {
  const start = startOfWeek(new Date(projectStart));
  const end = endOfWeek(new Date(projectEnd));

  const weeks: GanttWeek[] = [];
  let current = start;
  let index = 1;

  while (current <= end) {
    const weekStart = new Date(current);
    const weekEnd = endOfWeek(weekStart);
    weeks.push({
      index,
      label: `W${index}`,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      monthLabel: weekStart.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    });

    current = new Date(weekStart);
    current.setDate(current.getDate() + 7);
    index += 1;
  }

  return weeks;
}

function buildMonthSegments(weeks: GanttWeek[]): MonthSegment[] {
  const segments: MonthSegment[] = [];

  weeks.forEach((week) => {
    const { monthLabel } = week;
    const lastSegment = segments[segments.length - 1];

    if (lastSegment && lastSegment.label === monthLabel) {
      lastSegment.span += 1;
    } else {
      segments.push({ label: monthLabel, span: 1 });
    }
  });

  return segments;
}

function getTimelineBounds(weeks: GanttWeek[]): { start: number; end: number } {
  if (weeks.length === 0) {
    const now = Date.now();
    return { start: now, end: now };
  }

  const start = new Date(weeks[0].startDate).getTime();
  const end = new Date(weeks[weeks.length - 1].endDate).getTime();

  return { start, end };
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

export function GanttChart({
  tasks,
  projectStart,
  projectEnd,
  canRecordProgress,
  onTaskView,
  onTaskUpdate,
  onWeekSelect,
}: GanttChartProps) {
  const weeks = useMemo(() => generateWeeks(projectStart, projectEnd), [projectStart, projectEnd]);
  const months = useMemo(() => buildMonthSegments(weeks), [weeks]);
  const { start: timelineStart, end: timelineEnd } = useMemo(
    () => getTimelineBounds(weeks),
    [weeks]
  );

  const orderedTasks = useMemo(() => {
    const orderMap = new Map<string, number>();
    PRIMARY_TASK_ORDER.forEach((name, idx) => {
      orderMap.set(name, idx);
    });

    return [...tasks].sort((a, b) => {
      const orderA = orderMap.has(a.name) ? orderMap.get(a.name)! : Number.POSITIVE_INFINITY;
      const orderB = orderMap.has(b.name) ? orderMap.get(b.name)! : Number.POSITIVE_INFINITY;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });
  }, [tasks]);

  const timelineGridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${weeks.length}, minmax(${WEEK_COLUMN_MIN_WIDTH}px, 1fr))`,
    }),
    [weeks.length]
  );

  const canViewTasks = orderedTasks.length > 0 && weeks.length > 0;

  const timelineDuration = Math.max(timelineEnd - timelineStart, 1);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="border-b border-slate-200">
        <div
          className="grid"
          style={{ gridTemplateColumns: `${TASK_COLUMN_WIDTH}px 1fr` }}
        >
          <div className="bg-slate-900 text-white px-4 py-3 text-sm font-semibold uppercase tracking-wide">
            Phase
          </div>
          <div className="bg-slate-900 text-white">
            <div className="px-4 py-3 text-sm font-semibold uppercase tracking-wide">Timeline</div>
            {weeks.length > 0 ? (
              <div className="border-t border-slate-800">
                <div className="grid text-xs text-slate-100" style={timelineGridStyle}>
                  {months.map((segment, idx) => (
                    <div
                      key={`${segment.label}-${idx}`}
                      className="px-2 py-2 text-center font-medium border-l border-slate-800"
                      style={{ gridColumn: `span ${segment.span} / span ${segment.span}` }}
                    >
                      {segment.label}
                    </div>
                  ))}
                </div>
                <div className="grid text-[11px] text-slate-200 border-t border-slate-800" style={timelineGridStyle}>
                  {weeks.map((week) => (
                    <button
                      key={week.label}
                      onClick={() => onWeekSelect(week)}
                      className="px-2 py-1.5 border-l border-slate-800 hover:bg-slate-800/60 transition-colors"
                      type="button"
                    >
                      {week.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-slate-200">Timeline unavailable</div>
            )}
          </div>
        </div>
      </div>

      {!canViewTasks ? (
        <div className="p-8 text-center text-slate-500 text-sm">
          No tasks available for the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <ul className="divide-y divide-slate-200">
              {orderedTasks.map((task) => {
                const taskStart = new Date(task.start_date).getTime();
                const taskEnd = new Date(task.end_date).getTime();
                const clampedStart = Math.max(taskStart, timelineStart);
                const clampedEnd = Math.max(clampedStart, Math.min(taskEnd, timelineEnd));
                const left = clampPercent(((clampedStart - timelineStart) / timelineDuration) * 100);
                const width = clampPercent(((clampedEnd - clampedStart) / timelineDuration) * 100);

                const statusColor = getStatusColor(task.status);

                return (
                  <li key={task.id} className="grid" style={{ gridTemplateColumns: `${TASK_COLUMN_WIDTH}px 1fr` }}>
                    <div className="px-4 py-4 border-r border-slate-200 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{task.name}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 font-medium ${getRoleBadgeColor(task.owner_role)}`}>
                              {task.owner_role}
                            </span>
                            <span className={`inline-flex items-center rounded px-2 py-0.5 font-medium ${getStatusBadgeColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                          {new Date(task.start_date).toLocaleDateString()} –{' '}
                          {new Date(task.end_date).toLocaleDateString()}
                        </span>
                        <span>{task.percent_done}% complete</span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onTaskView(task)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          View details
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

                    <div className="relative border-slate-200 bg-slate-50">
                      <div className="absolute inset-0">
                        <div className="grid h-full" style={timelineGridStyle}>
                          {weeks.map((week) => (
                            <div key={`${task.id}-${week.label}`} className="border-l border-slate-200" />
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onTaskView(task)}
                        className="relative block h-20 w-full"
                      >
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 rounded-full shadow-sm ${statusColor}`}
                          style={{ left: `${left}%`, width: `${Math.max(width, 2)}%`, minWidth: '24px', height: '40px' }}
                        >
                          <div
                            className="absolute inset-y-1 left-1 rounded-full bg-white/30"
                            style={{ width: `${clampPercent(task.percent_done)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow">
                            {task.percent_done}%
                          </span>
                        </div>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function filterTasksByWeek(tasks: TaskRow[], week: GanttWeek): TaskRow[] {
  const weekStart = new Date(week.startDate).getTime();
  const weekEnd = new Date(week.endDate).getTime();

  return tasks.filter((task) => {
    const taskStart = new Date(task.start_date).getTime();
    const taskEnd = new Date(task.end_date).getTime();

    return taskStart <= weekEnd && taskEnd >= weekStart;
  });
}
