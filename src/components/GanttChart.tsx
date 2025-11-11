import { useState, useMemo, memo } from 'react';
import { Task } from '../types';
import { Language, useTranslation } from '../lib/i18n';
import { BarChart3, List } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  projectStart: string;
  projectEnd: string;
  currentDate?: string;
  onWeekClick: (task: Task, year: number, week: number) => void;
  language: Language;
  isReadOnly?: boolean;
  highlightRole?: string;
  onViewChange?: (view: 'gantt' | 'list') => void;
  currentView?: 'gantt' | 'list';
}

interface MonthColumn {
  label: string;
  weeks: WeekColumn[];
}

interface WeekColumn {
  weekNumber: number;
  date: Date;
  isCurrentWeek: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Done':
      return 'bg-gray-500';
    case 'On Track':
      return 'bg-gray-400';
    case 'Delayed':
      return 'bg-gray-400';
    case 'Blocked':
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
};

export const GanttChart = memo(function GanttChart({
  tasks,
  projectStart,
  projectEnd,
  currentDate,
  onWeekClick,
  language,
  isReadOnly = false,
  highlightRole,
  onViewChange,
  currentView = 'gantt'
}: GanttChartProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const t = useTranslation(language);

  const { monthColumns, allWeeks } = useMemo(() => {
    const start = new Date(projectStart);
    const end = new Date(projectEnd);

    const months: MonthColumn[] = [];
    const weeks: WeekColumn[] = [];

    const current = new Date(start);
    current.setDate(1);

    let currentWeekDate: Date | null = null;
    if (currentDate) {
      currentWeekDate = new Date(currentDate);
    }

    while (current <= end) {
      const monthLabel = current.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'long'
      }).toUpperCase();

      const monthWeeks: WeekColumn[] = [];
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const daysInMonth = monthEnd.getDate();

      for (let week = 1; week <= 4; week++) {
        const weekStartDay = (week - 1) * 7 + 1;
        if (weekStartDay <= daysInMonth) {
          const weekDate = new Date(current.getFullYear(), current.getMonth(), weekStartDay);

          let isCurrentWeek = false;
          if (currentWeekDate) {
            const weekEnd = new Date(weekDate);
            weekEnd.setDate(weekEnd.getDate() + 6);
            isCurrentWeek = currentWeekDate >= weekDate && currentWeekDate <= weekEnd;
          }

          const weekCol: WeekColumn = {
            weekNumber: week,
            date: weekDate,
            isCurrentWeek
          };

          monthWeeks.push(weekCol);
          weeks.push(weekCol);
        }
      }

      months.push({
        label: monthLabel,
        weeks: monthWeeks
      });

      current.setMonth(current.getMonth() + 1);
    }

    return { monthColumns: months, allWeeks: weeks };
  }, [projectStart, projectEnd, currentDate, language]);

  const isTaskInWeek = (task: Task, weekDate: Date): boolean => {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    const weekEnd = new Date(weekDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return weekDate <= taskEnd && weekEnd >= taskStart;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ position: 'relative' }}>
      <div className="overflow-x-auto" style={{ position: 'relative' }}>
        <table className="w-full border-collapse" style={{ minWidth: '1200px', position: 'relative' }}>
          <thead>
            {/* Month Headers */}
            <tr>
              <th className="border border-gray-400 bg-white p-3 text-left font-bold text-sm w-64">
                <div className="flex items-center justify-between">
                  <span>TASKS</span>
                  {onViewChange && (
                    <div className="flex gap-1" style={{ position: 'relative', zIndex: 60 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('toggle -> gantt');
                          onViewChange('gantt');
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          currentView === 'gantt'
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title={t.ganttChart}
                        style={{ minHeight: '44px', minWidth: '44px' }}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('toggle -> list');
                          onViewChange('list');
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          currentView === 'list'
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title={t.listView}
                        style={{ minHeight: '44px', minWidth: '44px' }}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </th>
              {monthColumns.map((month, idx) => (
                <th
                  key={idx}
                  colSpan={month.weeks.length}
                  className="border border-gray-400 bg-white p-3 text-center font-bold text-sm"
                >
                  {month.label}
                </th>
              ))}
            </tr>

            {/* Week Numbers */}
            <tr>
              <th className="border border-gray-400 bg-white"></th>
              {allWeeks.map((week, idx) => (
                <th
                  key={idx}
                  className={`border border-gray-400 bg-white p-2 text-center text-xs font-semibold ${
                    week.isCurrentWeek ? 'bg-blue-100' : ''
                  }`}
                  style={{ minWidth: '40px' }}
                >
                  {week.weekNumber}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => {
              const isMyTask = highlightRole && task.owner_roles.includes(highlightRole);

              return (
                <tr
                  key={task.id}
                  className={`hover:bg-gray-50 ${
                    isMyTask ? 'border-l-4 border-l-sky-400 bg-blue-50/20' : ''
                  }`}
                >
                  <td className="border border-gray-400 p-3 text-left">
                    <div className={`text-sm font-medium ${
                      isMyTask ? 'text-blue-900 font-semibold' : 'text-gray-900'
                    }`}>
                      {task.name}
                    </div>
                  </td>

                  {allWeeks.map((week, weekIdx) => {
                    const isInRange = isTaskInWeek(task, week.date);
                    const cellKey = `${task.id}-${weekIdx}`;
                    const isHovered = hoveredCell === cellKey;

                    return (
                      <td
                        key={weekIdx}
                        className={`border border-gray-400 p-1 text-center ${
                          !isReadOnly && isInRange ? 'cursor-pointer' : ''
                        } ${week.isCurrentWeek ? 'bg-blue-50' : ''}`}
                        style={{ position: 'relative' }}
                        onMouseEnter={() => !isReadOnly && isInRange && setHoveredCell(cellKey)}
                        onMouseLeave={() => !isReadOnly && setHoveredCell(null)}
                        onClick={() => {
                          if (!isReadOnly && isInRange) {
                            onWeekClick(task, week.date.getFullYear(), weekIdx + 1);
                          }
                        }}
                      >
                        {isInRange && (
                          <div
                            className={`h-8 rounded ${getStatusColor(task.status)} ${
                              isHovered ? 'opacity-80' : 'opacity-100'
                            } transition-opacity`}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
