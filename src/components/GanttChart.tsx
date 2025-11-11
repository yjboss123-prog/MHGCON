import { useState, useMemo, memo } from 'react';
import { Task } from '../types';
import { Language, useTranslation } from '../lib/i18n';
import { ArrowRight } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  projectStart: string;
  projectEnd: string;
  currentDate?: string;
  onWeekClick: (task: Task, year: number, week: number) => void;
  language: Language;
  isReadOnly?: boolean;
  highlightRole?: string;
}

interface MonthColumn {
  month: number;
  year: number;
  label: string;
  weekCount: number;
}

interface Week {
  weekIndex: number;
  weekInMonth: number;
  startDate: Date;
  endDate: Date;
  month: number;
  year: number;
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

function getMonthLabel(month: number, language: Language): string {
  const date = new Date(2026, month, 1);
  return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }).toUpperCase();
}

export const GanttChart = memo(function GanttChart({
  tasks,
  projectStart,
  projectEnd,
  currentDate,
  onWeekClick,
  language,
  isReadOnly = false,
  highlightRole
}: GanttChartProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const t = useTranslation(language);

  const { months, weeks, currentWeekIndex } = useMemo(() => {
    const start = new Date(projectStart);
    const end = new Date(projectEnd);

    const allWeeks: Week[] = [];
    const monthsMap = new Map<string, MonthColumn>();

    const currentWeek = new Date(start);
    const dayOfWeek = currentWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentWeek.setDate(currentWeek.getDate() - daysToMonday);

    let weekIndex = 0;

    while (currentWeek <= end) {
      const weekStart = new Date(currentWeek);
      const weekEnd = new Date(currentWeek);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const month = weekStart.getMonth();
      const year = weekStart.getFullYear();
      const monthKey = `${year}-${month}`;

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          month,
          year,
          label: getMonthLabel(month, language),
          weekCount: 0
        });
      }

      const monthData = monthsMap.get(monthKey)!;
      monthData.weekCount++;

      allWeeks.push({
        weekIndex,
        weekInMonth: monthData.weekCount,
        startDate: weekStart,
        endDate: weekEnd,
        month,
        year
      });

      weekIndex++;
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    let currentIdx = -1;
    if (currentDate) {
      const current = new Date(currentDate);
      currentIdx = allWeeks.findIndex(w =>
        current >= w.startDate && current <= w.endDate
      );
    }

    return {
      months: Array.from(monthsMap.values()),
      weeks: allWeeks,
      currentWeekIndex: currentIdx
    };
  }, [projectStart, projectEnd, currentDate, language]);

  const getTaskWeekCells = (task: Task) => {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);

    return weeks.map(week => {
      const isInRange = week.startDate <= taskEnd && week.endDate >= taskStart;
      return {
        week,
        isInRange
      };
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden landscape:h-full">
      <div className="overflow-x-auto overscroll-x-contain landscape:h-full smooth-scroll" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="inline-block min-w-full landscape:h-full" style={{ minWidth: '900px' }}>

          {/* Month Headers */}
          <div className="flex border-b-2 border-slate-300">
            <div className="w-40 sm:w-64 flex-shrink-0 bg-slate-50 border-r border-slate-300 px-2 sm:px-4 py-2 sm:py-3">
              <span className="text-xs sm:text-sm font-semibold text-slate-700">{t.tasks}</span>
            </div>
            <div className="flex flex-1">
              {months.map((month, idx) => (
                <div
                  key={`${month.year}-${month.month}`}
                  className="border-r border-slate-300 bg-slate-50 px-1 sm:px-2 py-2 sm:py-3 text-center"
                  style={{ width: `${(month.weekCount / weeks.length) * 100}%` }}
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">{month.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Week Numbers */}
          <div className="flex border-b border-slate-300">
            <div className="w-40 sm:w-64 flex-shrink-0 bg-slate-50 border-r border-slate-300"></div>
            <div className="flex flex-1">
              {weeks.map((week, idx) => (
                <div
                  key={week.weekIndex}
                  className={`border-r border-slate-200 bg-slate-50 px-1 py-2 text-center flex-1 relative ${
                    idx === currentWeekIndex ? 'bg-blue-100' : ''
                  }`}
                  style={{ minWidth: '40px' }}
                >
                  <span className="text-xs text-slate-600">{week.weekInMonth}</span>
                  {idx === currentWeekIndex && (
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-600"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          {tasks.map((task) => {
            const taskWeekCells = getTaskWeekCells(task);
            const isMyTask = highlightRole && task.owner_roles.includes(highlightRole);

            return (
              <div
                key={task.id}
                className={`flex border-b border-slate-200 hover:bg-slate-50 ${
                  task.was_shifted ? 'bg-blue-50/30' : ''
                } ${
                  isMyTask ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/50' : ''
                }`}
              >
                <div className="w-40 sm:w-64 flex-shrink-0 border-r border-slate-300 px-2 sm:px-4 py-2 sm:py-3 pointer-events-none sm:pointer-events-auto">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div
                      className={`text-xs sm:text-sm font-medium truncate ${
                        isMyTask ? 'text-blue-900 font-semibold' : 'text-slate-900'
                      }`}
                      title={task.name}
                    >
                      {task.name}
                    </div>
                    {task.was_shifted && (
                      <span
                        className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs font-bold bg-blue-600 text-white shadow-sm flex-shrink-0 animate-pulse"
                        title={language === 'fr' ? 'Planning décalé' : 'Schedule shifted'}
                      >
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">{language === 'fr' ? 'DÉCALÉ' : 'SHIFTED'}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 sm:mt-1 truncate" title={task.owner_roles.join(', ')}>
                    {task.owner_roles.join(', ')}
                  </div>
                </div>

                <div className="flex flex-1">
                  {taskWeekCells.map((cell, idx) => {
                    const cellKey = `${task.id}-${cell.week.weekIndex}`;
                    const isHovered = hoveredCell === cellKey;
                    const isTodayWeek = idx === currentWeekIndex;

                    return (
                      <div
                        key={cell.week.weekIndex}
                        className={`border-r border-slate-200 p-1 flex items-center justify-center flex-1 relative pointer-events-none ${
                          !isReadOnly ? 'sm:cursor-pointer sm:pointer-events-auto' : ''
                        }`}
                        style={{ minWidth: '40px' }}
                        onMouseEnter={() => !isReadOnly && setHoveredCell(cellKey)}
                        onMouseLeave={() => !isReadOnly && setHoveredCell(null)}
                        onClick={() => {
                          if (!isReadOnly && cell.isInRange && window.innerWidth >= 640) {
                            onWeekClick(task, cell.week.year, cell.week.weekInMonth);
                          }
                        }}
                      >
                        {cell.isInRange && (
                          <div
                            className={`w-full h-8 rounded ${getStatusColor(task.status)} ${
                              isHovered && !isReadOnly ? 'opacity-80 ring-2 ring-slate-900' : 'opacity-90'
                            } ${
                              isMyTask ? 'ring-2 ring-blue-600' : ''
                            } transition-all`}
                          />
                        )}
                        {isTodayWeek && (
                          <div className="absolute inset-y-0 left-0 w-1 bg-blue-600 z-10"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-slate-200 px-4 py-3 bg-slate-50 flex items-center gap-6 text-xs">
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
  );
});
