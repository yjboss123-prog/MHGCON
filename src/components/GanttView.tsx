import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Task } from '../types';
import { updateTask } from '../lib/api';

type GanttViewProps = {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  userRole?: string;
  userToken?: string;
  language: 'en' | 'fr';
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTHS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
];

const STATUS_COLORS = {
  'On Track': 'bg-emerald-500',
  'Delayed': 'bg-amber-500',
  'Blocked': 'bg-red-500',
  'Done': 'bg-slate-400'
};

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(2026, 0, 1);
  const daysSinceStart = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(daysSinceStart / 7);
}

function getMonthFromWeek(weekNumber: number): number {
  return Math.floor(weekNumber / 4);
}

export function GanttView({ tasks, onTaskUpdate, userRole, userToken, language }: GanttViewProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalDates, setOriginalDates] = useState<{ start: string; end: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const monthNames = language === 'fr' ? MONTHS_FR : MONTHS;
  const isContractor = userRole === 'contractor';

  const handleDownloadCSV = () => {
    const headers = ['Task', 'Start Date', 'End Date', 'Status', 'Assigned To', 'Progress'];
    const rows = tasks.map(task => [
      task.name,
      task.start_date,
      task.end_date,
      task.status,
      task.assigned_display_name || '',
      `${task.percent_done}%`
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gantt-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateBarPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startWeek = getWeekNumber(start);
    const endWeek = getWeekNumber(end);

    const left = Math.max(0, Math.min(47, startWeek));
    const width = Math.max(1, Math.min(48 - left, endWeek - startWeek + 1));

    return { left, width };
  };

  const handleMouseDown = (e: React.MouseEvent, taskId: string, type: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setDraggedTask(taskId);
    setDragType(type);
    setDragStartX(e.clientX);
    setOriginalDates({ start: task.start_date, end: task.end_date });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedTask || !dragType || !originalDates || !scrollRef.current) return;

    const task = tasks.find(t => t.id === draggedTask);
    if (!task) return;

    const rect = scrollRef.current.getBoundingClientRect();
    const weekWidth = rect.width / 48;
    const deltaX = e.clientX - dragStartX;
    const weeksDelta = Math.round(deltaX / weekWidth);

    if (weeksDelta === 0) return;

    const startDate = new Date(originalDates.start);
    const endDate = new Date(originalDates.end);

    if (dragType === 'move') {
      startDate.setDate(startDate.getDate() + weeksDelta * 7);
      endDate.setDate(endDate.getDate() + weeksDelta * 7);
    } else if (dragType === 'resize-start') {
      startDate.setDate(startDate.getDate() + weeksDelta * 7);
      if (startDate >= endDate) return;
    } else if (dragType === 'resize-end') {
      endDate.setDate(endDate.getDate() + weeksDelta * 7);
      if (endDate <= startDate) return;
    }

    if (startDate.getFullYear() !== 2026 || endDate.getFullYear() !== 2026) return;

    const updatedTask = {
      ...task,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };

    updateTask(updatedTask.id, {
      start_date: updatedTask.start_date,
      end_date: updatedTask.end_date
    }).then(() => {
      onTaskUpdate(updatedTask);
    });
  };

  const handleMouseUp = () => {
    setDraggedTask(null);
    setDragType(null);
    setDragStartX(0);
    setOriginalDates(null);
  };

  useEffect(() => {
    if (draggedTask) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTask, dragType, dragStartX, originalDates]);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">
          {language === 'fr' ? 'Vue Gantt 2026' : 'Gantt View 2026'}
        </h2>
        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
      </div>

      <div className="overflow-x-auto" ref={scrollRef}>
        <div className="min-w-[1200px]">
          <div className="sticky top-0 bg-white z-10 border-b-2 border-slate-300">
            <div className="flex">
              <div className="w-48 flex-shrink-0 border-r border-slate-200 p-2 font-semibold text-sm text-slate-700">
                {language === 'fr' ? 'Tâche' : 'Task'}
              </div>
              <div className="flex-1 flex">
                {Array.from({ length: 12 }).map((_, monthIdx) => (
                  <div
                    key={monthIdx}
                    className="flex-1 border-r border-slate-200 text-center p-2 font-semibold text-sm text-slate-700"
                  >
                    {monthNames[monthIdx]}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex">
              <div className="w-48 flex-shrink-0 border-r border-slate-200"></div>
              <div className="flex-1 flex">
                {Array.from({ length: 48 }).map((_, weekIdx) => (
                  <div
                    key={weekIdx}
                    className="flex-1 border-r border-slate-100 text-center py-1 text-xs text-slate-500"
                  >
                    {(weekIdx % 4) + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {tasks.map((task, idx) => {
              const { left, width } = calculateBarPosition(task.start_date, task.end_date);
              const isMyTask = isContractor && task.assigned_user_token === userToken;
              const showHighlight = isMyTask;

              return (
                <div
                  key={task.id}
                  className={`flex border-b border-slate-100 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
                >
                  <div className="w-48 flex-shrink-0 border-r border-slate-200 p-2 text-sm text-slate-700 truncate">
                    {task.name}
                  </div>
                  <div className="flex-1 relative h-12">
                    <div className="absolute inset-0 flex">
                      {Array.from({ length: 48 }).map((_, weekIdx) => (
                        <div
                          key={weekIdx}
                          className="flex-1 border-r border-slate-100"
                        />
                      ))}
                    </div>
                    <div
                      className={`absolute top-2 h-8 rounded ${STATUS_COLORS[task.status]} cursor-move group ${
                        showHighlight ? 'ring-2 ring-sky-400/60' : ''
                      }`}
                      style={{
                        left: `${(left / 48) * 100}%`,
                        width: `${(width / 48) * 100}%`,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, task.id, 'move')}
                      title={`${task.name}\n${task.start_date} → ${task.end_date}\n${task.assigned_display_name || ''}\n${task.status}`}
                    >
                      <div
                        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize hover:bg-black/20"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, task.id, 'resize-start');
                        }}
                      />
                      <div
                        className="absolute right-0 top-0 w-2 h-full cursor-ew-resize hover:bg-black/20"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, task.id, 'resize-end');
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
