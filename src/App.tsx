import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { GanttChart } from './components/GanttChart';
import { TaskList } from './components/TaskList';
import { TaskDrawer } from './components/TaskDrawer';
import { AddTaskModal } from './components/AddTaskModal';
import { WeekDetailsModal } from './components/WeekDetailsModal';
import { Task, Role, TaskStatus } from './types';
import { getTasks, initializeData } from './lib/api';
import { Language, useTranslation } from './lib/i18n';

const PROJECT_START = '2024-11-01';
const PROJECT_END = '2025-09-30';

type ViewMode = 'gantt' | 'list';

function App() {
  const [currentRole, setCurrentRole] = useState<Role>('Project Manager');
  const [language, setLanguage] = useState<Language>('en');
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const t = useTranslation(language);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'update'>('view');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<{ year: number; week: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      await initializeData();
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    tasks.forEach((task) => {
      const date = new Date(task.start_date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.add(monthYear);
    });
    return Array.from(months).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(task.status)) {
        return false;
      }

      if (selectedRoles.length > 0 && !selectedRoles.includes(task.owner_role)) {
        return false;
      }

      if (selectedMonths.length > 0) {
        const taskMonth = new Date(task.start_date).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
        if (!selectedMonths.includes(taskMonth)) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, selectedStatuses, selectedRoles, selectedMonths]);

  const handleStatusToggle = (status: TaskStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleRoleToggle = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleMonthToggle = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSelectedRoles([]);
    setSelectedMonths([]);
  };

  const handleTaskView = (task: Task) => {
    setSelectedTask(task);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  };

  const handleTaskUpdate = (task: Task) => {
    setSelectedTask(task);
    setDrawerMode('update');
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedTask(null);
    }, 300);
  };

  const handleTaskUpdated = async () => {
    await loadTasks();
    if (selectedTask) {
      const updatedTask = tasks.find((t) => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  };

  const handleWeekClick = (task: Task, year: number, week: number) => {
    setSelectedTask(task);
    setSelectedWeek({ year, week });
    setIsWeekModalOpen(true);
  };

  const handleWeekModalClose = () => {
    setIsWeekModalOpen(false);
    setTimeout(() => {
      setSelectedWeek(null);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onAddTask={() => setIsAddModalOpen(true)}
        language={language}
        onLanguageChange={setLanguage}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <FilterPanel
            selectedStatuses={selectedStatuses}
            selectedRoles={selectedRoles}
            selectedMonths={selectedMonths}
            availableMonths={availableMonths}
            onStatusToggle={handleStatusToggle}
            onRoleToggle={handleRoleToggle}
            onMonthToggle={handleMonthToggle}
            onClearFilters={handleClearFilters}
          />

          <div className="flex bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'gantt'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.ganttChart}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.listView}
            </button>
          </div>
        </div>

        <main>
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-slate-500">{t.loadingTasks}</p>
            </div>
          ) : viewMode === 'gantt' ? (
            <GanttChart
              tasks={filteredTasks}
              projectStart={PROJECT_START}
              projectEnd={PROJECT_END}
              onWeekClick={handleWeekClick}
              language={language}
            />
          ) : (
            <TaskList
              tasks={filteredTasks}
              currentRole={currentRole}
              projectStart={PROJECT_START}
              projectEnd={PROJECT_END}
              onTaskView={handleTaskView}
              onTaskUpdate={handleTaskUpdate}
            />
          )}
        </main>
      </div>

      <TaskDrawer
        task={selectedTask}
        currentRole={currentRole}
        isOpen={isDrawerOpen}
        mode={drawerMode}
        onClose={handleDrawerClose}
        onTaskUpdated={handleTaskUpdated}
      />

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTaskAdded={loadTasks}
      />

      <WeekDetailsModal
        isOpen={isWeekModalOpen}
        onClose={handleWeekModalClose}
        task={selectedTask}
        year={selectedWeek?.year || 0}
        week={selectedWeek?.week || 0}
        currentRole={currentRole}
        language={language}
      />
    </div>
  );
}

export default App;
