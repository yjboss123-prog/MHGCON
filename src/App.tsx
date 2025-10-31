import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { TaskList } from './components/TaskList';
import { TaskDrawer } from './components/TaskDrawer';
import { AddTaskModal } from './components/AddTaskModal';
import { Task, Role, TaskStatus } from './types';
import { getFirstProject, getTasks as fetchTasks, TaskRow, ProjectRow } from './services/db';

const PROJECT_START = '2024-11-01';
const PROJECT_END = '2025-09-30';

function App() {
  const [currentRole, setCurrentRole] = useState<Role>('Project Manager');
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'update'>('view');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const projectData = await getFirstProject();
        if (!projectData) {
          setErrorMsg('No project found');
          setProject(null);
          setTasks([]);
          return;
        }

        setProject(projectData);
        const data = await fetchTasks(projectData.id);
        setTasks(data);
        setErrorMsg(null);
      } catch (error) {
        console.error('Error loading project:', error);
        setErrorMsg(error instanceof Error ? error.message : 'Failed to load project');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const loadTasks = useCallback(async () => {
    if (!project) {
      return [] as TaskRow[];
    }

    setIsLoading(true);
    try {
      const data = await fetchTasks(project.id);
      setTasks(data);
      setErrorMsg(null);
      return data;
    } catch (error) {
      console.error('Error loading tasks:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Failed to load tasks');
      return [] as TaskRow[];
    } finally {
      setIsLoading(false);
    }
  }, [project]);

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
    const updatedTasks = await loadTasks();
    if (updatedTasks.length === 0) {
      return;
    }

    setSelectedTask((current) => {
      if (!current) {
        return current;
      }

      const match = updatedTasks.find((t) => t.id === current.id);
      return match ?? current;
    });
  };

  const projectStartDate = project?.start_date ?? PROJECT_START;
  const projectEndDate = project?.end_date ?? PROJECT_END;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onAddTask={() => setIsAddModalOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
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
          </aside>

          <main className="lg:col-span-3 space-y-4">
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-slate-500">Loading tasks...</p>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    <p>{errorMsg}</p>
                  </div>
                )}
                {(!errorMsg || tasks.length > 0) && (
                  <TaskList
                    tasks={filteredTasks}
                    currentRole={currentRole}
                    projectStart={projectStartDate}
                    projectEnd={projectEndDate}
                    onTaskView={handleTaskView}
                    onTaskUpdate={handleTaskUpdate}
                  />
                )}
              </>
            )}
          </main>
        </div>
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
        projectId={project?.id ?? null}
        onTaskAdded={loadTasks}
      />
    </div>
  );
}

export default App;
