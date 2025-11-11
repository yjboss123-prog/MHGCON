import { memo, useMemo } from 'react';
import { Task } from '../types';
import { Language, useTranslation } from '../lib/i18n';

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

const BASE_TASK_NAMES = [
  'Installation de chantier',
  'Terrassement',
  'Fondations production',
  'Charpente métallique',
  'Couverture & bardage',
  'Dallage',
  'Fondations administration/social',
  'Élévation',
  'Plancher',
  'Équipements industriels',
  'Lots architecturaux',
  'Lots techniques',
  'Aménagement extérieur',
];

const MONTHS_PER_YEAR = 12;
const WEEKS_PER_MONTH = 4;
const TOTAL_WEEKS = MONTHS_PER_YEAR * WEEKS_PER_MONTH;
const WEEK_WIDTH = 48; // pixels

interface TimelineTask {
  name: string;
  startWeek: number;
  endWeek: number;
}

interface MonthColumn {
  index: number;
  label: string;
}

interface WeekCell {
  monthIndex: number;
  weekOfMonth: number;
  globalIndex: number;
}

const clampWeek = (week: number) => Math.min(TOTAL_WEEKS - 1, Math.max(0, week));

const getWeekIndexFromDate = (date: Date) => {
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const month = date.getMonth();
  const weekInsideMonth = Math.min(
    WEEKS_PER_MONTH - 1,
    Math.floor((date.getDate() - 1) / 7)
  );

  return clampWeek(month * WEEKS_PER_MONTH + weekInsideMonth);
};

export const GanttChart = memo(function GanttChart({
  tasks,
  projectStart,
  language,
}: GanttChartProps) {
  const t = useTranslation(language);

  const baseYear = useMemo(() => {
    const parsed = new Date(projectStart);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getFullYear();
    }
    return new Date().getFullYear();
  }, [projectStart]);

  const monthColumns = useMemo<MonthColumn[]>(() => {
    return Array.from({ length: MONTHS_PER_YEAR }, (_, index) => {
      const date = new Date(baseYear, index, 1);
      const label = date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'short',
      });

      return {
        index,
        label: label.charAt(0).toUpperCase() + label.slice(1),
      };
    });
  }, [baseYear, language]);

  const weekCells = useMemo<WeekCell[]>(() => {
    return monthColumns.flatMap((month) =>
      Array.from({ length: WEEKS_PER_MONTH }, (_, weekIndex) => ({
        monthIndex: month.index,
        weekOfMonth: weekIndex + 1,
        globalIndex: month.index * WEEKS_PER_MONTH + weekIndex,
      }))
    );
  }, [monthColumns]);

  const timelineWidth = TOTAL_WEEKS * WEEK_WIDTH;
  const gridTemplateColumns = `repeat(${TOTAL_WEEKS}, ${WEEK_WIDTH}px)`;
  const monthGridTemplate = `repeat(${MONTHS_PER_YEAR}, ${WEEKS_PER_MONTH * WEEK_WIDTH}px)`;

  const timelineTasks = useMemo<TimelineTask[]>(() => {
    return BASE_TASK_NAMES.map((taskName, index) => {
      const matchingTask = tasks.find(
        (task) => task.name.trim().toLowerCase() === taskName.trim().toLowerCase()
      );

      if (matchingTask) {
        const startWeek = getWeekIndexFromDate(new Date(matchingTask.start_date));
        const endWeek = getWeekIndexFromDate(new Date(matchingTask.end_date));
        const normalizedStart = clampWeek(Math.min(startWeek, endWeek));
        const normalizedEnd = clampWeek(Math.max(startWeek, endWeek));

        return {
          name: taskName,
          startWeek: normalizedStart,
          endWeek: normalizedEnd,
        };
      }

      const fallbackStart = clampWeek(index * 3);
      const fallbackEnd = clampWeek(fallbackStart + 3);

      return {
        name: taskName,
        startWeek: fallbackStart,
        endWeek: fallbackEnd,
      };
    });
  }, [tasks]);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div
        className="overflow-x-auto scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="min-w-full">
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="w-56 sm:w-64 flex-shrink-0 border-r border-slate-200 px-4 py-3">
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                {t.tasks}
              </span>
            </div>
            <div
              className="grid"
              style={{ width: timelineWidth, gridTemplateColumns: monthGridTemplate }}
            >
              {monthColumns.map((month) => (
                <div
                  key={month.index}
                  className="border-r border-slate-200 px-2 py-3 text-center"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">
                    {month.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex border-b border-slate-200">
            <div className="w-56 sm:w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50"></div>
            <div
              className="relative"
              style={{ width: timelineWidth }}
            >
              <div
                className="grid text-center text-[10px] sm:text-xs text-slate-500"
                style={{ gridTemplateColumns }}
              >
                {weekCells.map((week) => (
                  <div
                    key={week.globalIndex}
                    className={`relative h-10 sm:h-12 flex items-center justify-center border-r border-slate-200 bg-white ${
                      week.weekOfMonth === 1 ? 'bg-slate-50' : ''
                    }`}
                  >
                    <span className="font-medium">W{week.weekOfMonth}</span>
                    {week.weekOfMonth === 1 && (
                      <div className="absolute inset-y-0 left-0 w-px bg-slate-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {timelineTasks.map((task) => {
            const barLeft = task.startWeek * WEEK_WIDTH;
            const barWidth = (task.endWeek - task.startWeek + 1) * WEEK_WIDTH;

            return (
              <div
                key={task.name}
                className="flex border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="w-56 sm:w-64 flex-shrink-0 border-r border-slate-200 px-4 py-3">
                  <p className="text-sm font-medium text-slate-900 leading-snug">
                    {task.name}
                  </p>
                </div>
                <div
                  className="relative h-12 sm:h-14"
                  style={{ width: timelineWidth }}
                >
                  <div
                    className="grid h-full"
                    style={{ gridTemplateColumns }}
                  >
                    {weekCells.map((week) => (
                      <div
                        key={`${task.name}-${week.globalIndex}`}
                        className={`border-r border-slate-200 ${
                          week.weekOfMonth === 1 ? 'bg-slate-50/30 border-l border-l-slate-300' : 'bg-white'
                        }`}
                      />
                    ))}
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: barLeft, width: barWidth }}
                  >
                    <div className="h-3 sm:h-4 rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 shadow-sm hover:shadow-md hover:shadow-slate-400/40 transition-shadow"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
