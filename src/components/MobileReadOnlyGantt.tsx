import { Task } from '../types';

interface MobileReadOnlyGanttProps {
  tasks: Task[];
  language: 'en' | 'fr';
  userToken?: string;
  isContractor?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  'Not Started': 'bg-slate-300',
  'On Track': 'bg-green-400',
  'At Risk': 'bg-yellow-400',
  'Delayed': 'bg-red-400',
  'Done': 'bg-blue-400',
};

export function MobileReadOnlyGantt({ tasks, language, userToken, isContractor }: MobileReadOnlyGanttProps) {
  const monthNames = language === 'fr'
    ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const calculateBarPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const baselineStart = new Date('2026-01-06');
    const baselineEnd = new Date('2026-12-31');

    const totalWeeks = 48;
    const projectStartTime = baselineStart.getTime();
    const projectDuration = baselineEnd.getTime() - projectStartTime;

    const taskStartWeek = Math.floor(((start.getTime() - projectStartTime) / projectDuration) * totalWeeks);
    const taskEndWeek = Math.ceil(((end.getTime() - projectStartTime) / projectDuration) * totalWeeks);

    const left = Math.max(0, taskStartWeek);
    const width = Math.max(1, taskEndWeek - taskStartWeek);

    return { left, width };
  };

  return (
    <div
      className="w-full overflow-x-auto overflow-y-hidden"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'auto',
      }}
    >
      <div className="inline-block min-w-[1200px]">
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
                    className={`absolute top-2 h-8 rounded ${STATUS_COLORS[task.status]} ${
                      showHighlight ? 'ring-2 ring-sky-400/60' : ''
                    }`}
                    style={{
                      left: `${(left / 48) * 100}%`,
                      width: `${(width / 48) * 100}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
