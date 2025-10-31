import { useState, useMemo } from 'react';
import { Task } from '../types';
import { getWeekNumber, getWeeksInRange } from '../lib/utils';

interface GanttChartProps {
  tasks: Task[];
  projectStart: string;
  projectEnd: string;
  onWeekClick: (task: Task, year: number, week: number) => void;
}

interface WeekCell {
  year: number;
  week: number;
  date: Date;
  isInTaskRange: boolean;
  monthLabel?: string;
}

export function GanttChart({ tasks, projectStart, projectEnd, onWeekClick }: GanttChartProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const { months, weeks, totalWeeks } = useMemo(() => {
    const start = new Date(projectStart);
    const end = new Date(projectEnd);
    const weeksData = getWeeksInRange(start, end);

    const monthsMap = new Map<string, { label: string; span: number; weekNumbers: number[] }>();

    weeksData.forEach((week, index) => {
      const monthKey = `${week.year}-${week.date.getMonth()}`;
      const monthLabel = week.date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, { label: monthLabel, span: 0, weekNumbers: [] });
      }
      const monthData = monthsMap.get(monthKey)!;
      monthData.span += 1;
      monthData.weekNumbers.push(monthData.weekNumbers.length + 1);
    });

    const weeksWithMonthNumbers = weeksData.map((week) => {
      const monthKey = `${week.year}-${week.date.getMonth()}`;
      const monthData = monthsMap.get(monthKey)!;
      const weekInMonth = monthData.weekNumbers[monthData.weekNumbers.findIndex((_, idx) => {
        let count = 0;
        for (const [key, data] of monthsMap.entries()) {
          if (key === monthKey) {
            return weeksData.indexOf(week) - count === idx;
          }
          count += data.span;
        }
        return false;
      })];

      return {
        ...week,
        weekInMonth: ((weeksData.indexOf(week) - Array.from(monthsMap.entries())
          .slice(0, Array.from(monthsMap.keys()).indexOf(monthKey))
          .reduce((sum, [, data]) => sum + data.span, 0)) % monthData.span) + 1
      };
    });

    return {
      months: Array.from(monthsMap.values()),
      weeks: weeksWithMonthNumbers,
      totalWeeks: weeksData.length,
    };
  }, [projectStart, projectEnd]);

  const getTaskWeekCells = (task: Task): WeekCell[] => {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);

    return weeks.map((week) => {
      const weekStart = new Date(week.date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const isInTaskRange = weekStart <= taskEnd && weekEnd >= taskStart;

      return {
        year: week.year,
        week: week.week,
        date: week.date,
        isInTaskRange,
      };
    });
  };

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

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month Headers */}
          <div className="flex border-b-2 border-slate-300">
            <div className="w-64 flex-shrink-0 bg-slate-50 border-r border-slate-300 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">TASKS</span>
            </div>
            <div className="flex flex-1">
              {months.map((month, idx) => (
                <div
                  key={idx}
                  className="border-r border-slate-300 bg-slate-50 px-2 py-3 text-center"
                  style={{ width: `${(month.span / totalWeeks) * 100}%` }}
                >
                  <span className="text-sm font-semibold text-slate-700">{month.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Week Numbers */}
          <div className="flex border-b border-slate-300">
            <div className="w-64 flex-shrink-0 bg-slate-50 border-r border-slate-300"></div>
            <div className="flex flex-1">
              {weeks.map((week, idx) => (
                <div
                  key={idx}
                  className="border-r border-slate-200 bg-slate-50 px-1 py-2 text-center flex-1"
                  style={{ minWidth: '40px' }}
                >
                  <span className="text-xs text-slate-600">{week.weekInMonth}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          {tasks.map((task) => {
            const taskWeeks = getTaskWeekCells(task);

            return (
              <div key={task.id} className="flex border-b border-slate-200 hover:bg-slate-50">
                <div className="w-64 flex-shrink-0 border-r border-slate-300 px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">{task.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{task.owner_role}</div>
                </div>
                <div className="flex flex-1">
                  {taskWeeks.map((weekCell, idx) => {
                    const cellKey = `${task.id}-${weekCell.year}-${weekCell.week}`;
                    const isHovered = hoveredCell === cellKey;

                    return (
                      <div
                        key={idx}
                        className="border-r border-slate-200 p-1 flex items-center justify-center flex-1 cursor-pointer relative"
                        style={{ minWidth: '40px' }}
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (weekCell.isInTaskRange) {
                            onWeekClick(task, weekCell.year, weekCell.week);
                          }
                        }}
                      >
                        {weekCell.isInTaskRange && (
                          <div
                            className={`w-full h-8 rounded ${getStatusColor(task.status)} ${
                              isHovered ? 'opacity-80 ring-2 ring-slate-900' : 'opacity-90'
                            } transition-all`}
                          />
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
        <span className="font-semibold text-slate-700">STATUS:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-400"></div>
          <span className="text-slate-600">On Track</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span className="text-slate-600">Delayed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-slate-600">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500"></div>
          <span className="text-slate-600">Done</span>
        </div>
      </div>
    </div>
  );
}
