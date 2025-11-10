import { Task } from '../types';
import { Language, useTranslation } from '../lib/i18n';
import { ArrowRight } from 'lucide-react';

interface GanttChartHorizontalProps {
  tasks: Task[];
  projectStart: string;
  projectEnd: string;
  language: Language;
}

export function GanttChartHorizontal({
  tasks,
  projectStart,
  projectEnd,
  language,
}: GanttChartHorizontalProps) {
  const t = useTranslation(language);

  const getTaskPosition = (task: Task) => {
    const projectStartDate = new Date(projectStart);
    const projectEndDate = new Date(projectEnd);
    const taskStartDate = new Date(task.start_date);
    const taskEndDate = new Date(task.end_date);

    const totalDuration = projectEndDate.getTime() - projectStartDate.getTime();
    const taskStart = taskStartDate.getTime() - projectStartDate.getTime();
    const taskDuration = taskEndDate.getTime() - taskStartDate.getTime();

    const left = (taskStart / totalDuration) * 100;
    const width = (taskDuration / totalDuration) * 100;

    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'bg-emerald-500';
      case 'Delayed':
        return 'bg-amber-500';
      case 'At Risk':
        return 'bg-orange-500';
      case 'Done':
        return 'bg-slate-400';
      default:
        return 'bg-slate-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">{t.ganttChart} - {t.horizontalView}</h3>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto smooth-scroll">
        {tasks.map((task) => {
          const position = getTaskPosition(task);

          return (
            <div key={task.id} className={`${task.was_shifted ? 'bg-blue-50 border border-blue-200 rounded-lg p-3' : 'p-3 border border-slate-100 rounded-lg'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{task.name}</h4>
                    {task.was_shifted && (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold bg-blue-600 text-white shadow-sm animate-pulse flex-shrink-0"
                        title={language === 'fr' ? 'Planning décalé' : 'Schedule shifted'}
                      >
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{task.owner_roles.join(', ')}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    task.status === 'On Track'
                      ? 'bg-emerald-100 text-emerald-800'
                      : task.status === 'Delayed'
                      ? 'bg-amber-100 text-amber-800'
                      : task.status === 'Blocked'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {task.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{task.percent_done}%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs text-slate-600">
                  {new Date(task.start_date).toLocaleDateString()} - {new Date(task.end_date).toLocaleDateString()}
                </div>

                <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 h-full"
                    style={position}
                  >
                    <div className={`h-full ${getStatusColor(task.status)} opacity-30`}></div>
                    <div
                      className={`absolute top-0 left-0 h-full ${getStatusColor(task.status)} transition-all`}
                      style={{ width: `${task.percent_done}%` }}
                    ></div>
                  </div>

                  <div className="absolute inset-0 flex items-center px-2">
                    <div
                      className="h-1 bg-slate-300 rounded-full"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>{new Date(projectStart).toLocaleDateString()}</span>
                  <span>{new Date(projectEnd).toLocaleDateString()}</span>
                </div>
              </div>

              {task.delay_reason && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  <span className="font-medium">{t.delayReason}:</span> {task.delay_reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
