import { useMemo, memo } from 'react';
import { Task } from '../types';
import { Language, useTranslation } from '../lib/i18n';

interface GanttChartHorizontalProps {
  tasks: Task[];
  projectStart: string;
  projectEnd: string;
  currentDate?: string;
  onTaskClick: (task: Task) => void;
  language: Language;
  highlightRole?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Done':
      return 'bg-emerald-500';
    case 'On Track':
      return 'bg-slate-400';
    case 'Delayed':
      return 'bg-amber-500';
    case 'Blocked':
      return 'bg-red-500';
    default:
      return 'bg-slate-300';
  }
};

function calculatePosition(
  taskStart: string,
  taskEnd: string,
  projectStart: string,
  projectEnd: string
): { left: number; width: number } {
  const pStart = new Date(projectStart).getTime();
  const pEnd = new Date(projectEnd).getTime();
  const tStart = new Date(taskStart).getTime();
  const tEnd = new Date(taskEnd).getTime();

  const totalDuration = pEnd - pStart;
  const left = ((tStart - pStart) / totalDuration) * 100;
  const width = ((tEnd - tStart) / totalDuration) * 100;

  return {
    left: Math.max(0, left),
    width: Math.max(1, width)
  };
}

export const GanttChartHorizontal = memo(function GanttChartHorizontal({
  tasks,
  projectStart,
  projectEnd,
  currentDate,
  onTaskClick,
  language,
  highlightRole
}: GanttChartHorizontalProps) {
  const t = useTranslation(language);

  const months = useMemo(() => {
    const start = new Date(projectStart);
    const end = new Date(projectEnd);
    const monthsList: { label: string; position: number; width: number }[] = [];

    const currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const projectStartTime = start.getTime();
    const totalDuration = end.getTime() - projectStartTime;

    while (currentMonth <= end) {
      const monthStart = new Date(currentMonth);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const effectiveStart = monthStart < start ? start : monthStart;
      const effectiveEnd = monthEnd > end ? end : monthEnd;

      const position = ((effectiveStart.getTime() - projectStartTime) / totalDuration) * 100;
      const width = ((effectiveEnd.getTime() - effectiveStart.getTime()) / totalDuration) * 100;

      const label = monthStart.toLocaleDateString(
        language === 'fr' ? 'fr-FR' : 'en-US',
        { month: 'short' }
      ).toUpperCase();

      monthsList.push({ label, position, width });

      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    return monthsList;
  }, [projectStart, projectEnd, language]);

  const currentDatePosition = useMemo(() => {
    if (!currentDate) return null;
    const pStart = new Date(projectStart).getTime();
    const pEnd = new Date(projectEnd).getTime();
    const current = new Date(currentDate).getTime();
    const totalDuration = pEnd - pStart;
    return ((current - pStart) / totalDuration) * 100;
  }, [currentDate, projectStart, projectEnd]);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Month Headers */}
        <div className="relative h-8 mb-2 border-b border-slate-300">
          {months.map((month, idx) => (
            <div
              key={idx}
              className="absolute top-0 text-center"
              style={{
                left: `${month.position}%`,
                width: `${month.width}%`
              }}
            >
              <span className="text-xs font-semibold text-slate-700">{month.label}</span>
            </div>
          ))}
        </div>

        {/* Timeline Bar */}
        <div className="relative h-2 bg-slate-100 rounded mb-4">
          {currentDatePosition !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-10"
              style={{ left: `${currentDatePosition}%` }}
            />
          )}
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          {tasks.map((task) => {
            const { left, width } = calculatePosition(
              task.start_date,
              task.end_date,
              projectStart,
              projectEnd
            );
            const isMyTask = highlightRole && task.owner_roles.includes(highlightRole);

            return (
              <div
                key={task.id}
                className="relative"
                onClick={() => onTaskClick(task)}
              >
                <div className="text-xs text-slate-600 mb-1 truncate">
                  {task.name}
                </div>
                <div className="relative h-8 bg-slate-100 rounded">
                  <div
                    className={`absolute top-0 bottom-0 rounded ${getStatusColor(task.status)} ${
                      isMyTask ? 'ring-2 ring-blue-600' : ''
                    } cursor-pointer hover:opacity-80 transition-opacity`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`
                    }}
                  />
                  {currentDatePosition !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-10 pointer-events-none"
                      style={{ left: `${currentDatePosition}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-6 text-xs">
          <span className="font-semibold text-slate-700">{t.status.toUpperCase()}:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-400"></div>
            <span className="text-slate-600">{t.onTrack}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500"></div>
            <span className="text-slate-600">{t.delayed}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-slate-600">{t.blocked}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500"></div>
            <span className="text-slate-600">{t.done}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
