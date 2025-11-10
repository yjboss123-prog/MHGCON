import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from 'react';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { GanttChart } from './components/GanttChart';
import { TaskList } from './components/TaskList';
import { TaskDrawer } from './components/TaskDrawer';
import { ProjectTabs } from './components/ProjectTabs';
import { AccessCodeEntry } from './components/AccessCodeEntry';
import { Task, Role, TaskStatus, DEFAULT_ROLES, Project } from './types';
import { getTasks, initializeData, shiftSchedule, deleteTask, rebaselineProject, getProject, updateProject, getAllProjects, createProject, duplicateProject, archiveProject, unarchiveProject, deleteProject } from './lib/api';
import { Language, useTranslation } from './lib/i18n';
import { getSession, validateSession, signOut, Session, isAdmin, canManageTasks, canDeleteTasks } from './lib/session';

const AddTaskModal = lazy(() => import('./components/AddTaskModal').then(m => ({ default: m.AddTaskModal })));
const WeekDetailsModal = lazy(() => import('./components/WeekDetailsModal').then(m => ({ default: m.WeekDetailsModal })));
const ShiftModal = lazy(() => import('./components/ShiftModal').then(m => ({ default: m.ShiftModal })));
const RebaselineModal = lazy(() => import('./components/RebaselineModal').then(m => ({ default: m.RebaselineModal })));
const ProjectSettingsModal = lazy(() => import('./components/ProjectSettingsModal').then(m => ({ default: m.ProjectSettingsModal })));
const InvitationManager = lazy(() => import('./components/InvitationManager').then(m => ({ default: m.InvitationManager })));
const ProjectOperationsModal = lazy(() => import('./components/ProjectOperationsModal').then(m => ({ default: m.ProjectOperationsModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));

const PROJECT_START = '2026-01-06';
const PROJECT_END = '2026-12-31';

type ViewMode = 'gantt' | 'list';

function App() {
  const [currentRole, setCurrentRole] = useState<Role>('Project Manager');
  const [language, setLanguage] = useState<Language>('fr');
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const [isLandscape, setIsLandscape] = useState(false);
  const t = useTranslation(language);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'update'>('view');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isRebaselineModalOpen, setIsRebaselineModalOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<{ year: number; week: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<'create' | 'rename'>('create');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const allRoles = useMemo(() => {
    if (!project) return DEFAULT_ROLES;
    return [...DEFAULT_ROLES, ...(project.custom_contractors || [])];
  }, [project]);

  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const storedSession = getSession();
    if (storedSession) {
      const validSession = await validateSession(storedSession.session_token);
      if (validSession) {
        setSession(validSession);
      }
    }
    setIsCheckingSession(false);
  };

  useEffect(() => {
    if (session) {
      setCurrentRole(session.display_name as Role);
    }
  }, [session]);

  useEffect(() => {
    loadProjects();
  }, [showArchived]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectIdFromUrl = params.get('projectId');

    if (projectIdFromUrl && projects.some(p => p.id === projectIdFromUrl)) {
      setActiveProjectId(projectIdFromUrl);
    } else if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) {
      loadProject();
      loadTasks();

      const params = new URLSearchParams(window.location.search);
      params.set('projectId', activeProjectId);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [activeProjectId]);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleSessionSuccess = () => {
    const storedSession = getSession();
    if (storedSession) {
      setSession(storedSession);
      loadProjects();
      loadTasks();
    }
  };

  const loadProjects = async () => {
    try {
      const data = await getAllProjects(showArchived);
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadTasks = async () => {
    if (!activeProjectId) return;

    setIsLoading(true);
    setLoadError(null);
    try {
      await initializeData();
      const data = await getTasks(activeProjectId, session);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProject = async () => {
    if (!activeProjectId) return;

    try {
      const data = await getProject(activeProjectId);
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
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

      if (selectedRoles.length > 0 && !task.owner_roles.some(role => selectedRoles.includes(role))) {
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

  const handleTaskView = useCallback((task: Task) => {
    setSelectedTask(task);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  }, []);

  const handleTaskUpdate = useCallback((task: Task) => {
    setSelectedTask(task);
    setDrawerMode('update');
    setIsDrawerOpen(true);
  }, []);

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedTask(null);
    }, 300);
  };

  const handleTaskUpdated = async () => {
    if (selectedTask) {
      const data = await getTasks(activeProjectId, session);
      const updatedTask = data.find((t) => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
      setTasks(data);
    } else {
      await loadTasks();
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

  const handleShiftTask = (task: Task) => {
    setSelectedTask(task);
    setIsShiftModalOpen(true);
  };

  const handleShiftConfirm = async (amount: number, unit: 'Days' | 'Weeks', skipDone: boolean) => {
    if (!selectedTask) return;

    try {
      const result = await shiftSchedule(selectedTask, amount, unit, skipDone);
      await loadTasks();
      setIsShiftModalOpen(false);

      const message = language === 'fr'
        ? `Décalage appliqué à ${result.shiftedCount} tâche${result.shiftedCount !== 1 ? 's' : ''}.`
        : `Shift applied to ${result.shiftedCount} task${result.shiftedCount !== 1 ? 's' : ''}.`;

      setToast(message);
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error shifting schedule:', error);
      const errorMsg = language === 'fr'
        ? 'Erreur lors du décalage du planning.'
        : 'Error shifting schedule.';
      setToast(errorMsg);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    const confirmMsg = language === 'fr'
      ? `Êtes-vous sûr de vouloir supprimer "${task.name}" ?`
      : `Are you sure you want to delete "${task.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteTask(task.id);
      await loadTasks();

      const successMsg = language === 'fr'
        ? 'Tâche supprimée avec succès.'
        : 'Task deleted successfully.';

      setToast(successMsg);
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error deleting task:', error);
      const errorMsg = language === 'fr'
        ? 'Erreur lors de la suppression de la tâche.'
        : 'Error deleting task.';
      setToast(errorMsg);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleRebaselineConfirm = async (
    newBaselineStart: string,
    resetStatuses: boolean,
    clearDelayReasons: boolean
  ) => {
    try {
      const result = await rebaselineProject(newBaselineStart, resetStatuses, clearDelayReasons);
      await loadProject();
      await loadTasks();

      const message = language === 'fr'
        ? `Recalibrage appliqué: ${result.shiftedCount} tâches déplacées de ${result.deltaDays} jours.`
        : `Rebaseline applied: ${result.shiftedCount} tasks shifted by ${result.deltaDays} days.`;

      setToast(message);
      setTimeout(() => setToast(null), 4000);
    } catch (error) {
      console.error('Error rebaselining project:', error);
      const errorMsg = language === 'fr'
        ? 'Erreur lors du recalibrage du projet.'
        : 'Error rebaselining project.';
      setToast(errorMsg);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleCreateProject = async (name: string, description: string) => {
    try {
      const newProject = await createProject(name, description);
      await loadProjects();
      setActiveProjectId(newProject.id);
      setToast('Project created successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error creating project:', error);
      setToast('Error creating project');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleRenameProject = async (name: string) => {
    if (!projectToRename || !project) return;

    try {
      await updateProject(projectToRename, name, project.description, project.custom_contractors);
      await loadProjects();
      await loadProject();
      setToast('Project renamed successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error renaming project:', error);
      setToast('Error renaming project');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      const newProject = await duplicateProject(projectId);
      await loadProjects();
      setActiveProjectId(newProject.id);
      setToast('Project duplicated successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error duplicating project:', error);
      setToast('Error duplicating project');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await archiveProject(projectId);
      await loadProjects();
      if (projectId === activeProjectId && projects.length > 1) {
        const nextProject = projects.find(p => p.id !== projectId && !p.archived);
        if (nextProject) setActiveProjectId(nextProject.id);
      }
      setToast('Project archived successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error archiving project:', error);
      setToast('Error archiving project');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleUnarchiveProject = async (projectId: string) => {
    try {
      await unarchiveProject(projectId);
      await loadProjects();
      setToast('Project unarchived successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error unarchiving project:', error);
      setToast('Error unarchiving project');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProject(projectId);
      await loadProjects();
      if (projectId === activeProjectId && projects.length > 1) {
        const nextProject = projects.find(p => p.id !== projectId);
        if (nextProject) setActiveProjectId(nextProject.id);
      }
      setToast('Project deleted successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error deleting project:', error);
      setToast('Error deleting project');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleProjectSettingsSave = async (name: string, description: string, customContractors: string[], currentDate: string) => {
    if (!project) return;

    try {
      const updatedProject = await updateProject(project.id, name, description, customContractors, currentDate);
      setProject(updatedProject);
      await loadTasks();

      const message = language === 'fr'
        ? 'Paramètres du projet mis à jour avec succès.'
        : 'Project settings updated successfully.';

      setToast(message);
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error updating project:', error);
      const errorMsg = language === 'fr'
        ? 'Erreur lors de la mise à jour des paramètres.'
        : 'Error updating project settings.';
      setToast(errorMsg);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSession(null);
      setTasks([]);
      setProjects([]);
      setToast('Signed out successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error signing out:', error);
      setToast('Error signing out');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const userIsAdmin = isAdmin(session);
  const canManage = canManageTasks(session);
  const canDelete = canDeleteTasks(session);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AccessCodeEntry onSuccess={handleSessionSuccess} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50 ${isLandscape ? 'landscape-mode' : ''}`}>
      {!isLandscape && (
        <Header
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          onAddTask={() => setIsAddModalOpen(true)}
          onRebaseline={() => setIsRebaselineModalOpen(true)}
          onProjectSettings={() => setIsProjectSettingsOpen(true)}
          onInvite={() => setIsInviteModalOpen(true)}
          onAdminPanel={() => setIsAdminPanelOpen(true)}
          language={language}
          onLanguageChange={setLanguage}
          projectName={project?.name || 'MHG Tracker'}
          projectDescription={project?.description || ''}
          allRoles={allRoles}
          userSession={session}
          onSignOut={handleSignOut}
        />
      )}

      <div className={`mx-auto ${isLandscape ? 'px-2 py-2' : 'max-w-[1600px] px-2 sm:px-4 lg:px-8 py-4 sm:py-6 pb-20'}`}>
        {!isLandscape && (
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <FilterPanel
              selectedStatuses={selectedStatuses}
              selectedRoles={selectedRoles}
              selectedMonths={selectedMonths}
              availableMonths={availableMonths}
              onStatusToggle={handleStatusToggle}
              onRoleToggle={handleRoleToggle}
              onMonthToggle={handleMonthToggle}
              onClearFilters={handleClearFilters}
              language={language}
              allRoles={allRoles}
            />

            <div className="flex bg-white rounded-lg shadow-sm p-1 self-center sm:self-auto">
              <button
                onClick={() => setViewMode('gantt')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'gantt'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.ganttChart}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.listView}
            </button>
          </div>
          </div>
        )}

        <main>
          {loadError ? (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Application</h3>
                <p className="text-slate-700 mb-4">{loadError}</p>
                <button
                  onClick={loadTasks}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-slate-500">{t.loadingTasks}</p>
            </div>
          ) : (viewMode === 'gantt' || isLandscape) ? (
            <GanttChart
              tasks={filteredTasks}
              projectStart={PROJECT_START}
              projectEnd={PROJECT_END}
              currentDate={project?.project_current_date}
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
              onTaskShift={handleShiftTask}
              onTaskDelete={handleDeleteTask}
              language={language}
            />
          )}
        </main>
      </div>

      {!isLandscape && (
        <ProjectTabs
          projects={projects}
          activeProjectId={activeProjectId}
          onProjectChange={setActiveProjectId}
          onCreateProject={() => {
            setProjectModalMode('create');
            setIsProjectModalOpen(true);
          }}
          onRenameProject={(projectId) => {
            const proj = projects.find(p => p.id === projectId);
            if (proj) {
              setProjectToRename(projectId);
              setProjectModalMode('rename');
              setIsProjectModalOpen(true);
            }
          }}
          onDuplicateProject={handleDuplicateProject}
          onArchiveProject={handleArchiveProject}
          onUnarchiveProject={handleUnarchiveProject}
          onDeleteProject={handleDeleteProject}
          showArchived={showArchived}
          onToggleShowArchived={() => setShowArchived(!showArchived)}
          canManage={canManage}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}

      <TaskDrawer
        task={selectedTask}
        currentRole={currentRole}
        isOpen={isDrawerOpen}
        mode={drawerMode}
        onClose={handleDrawerClose}
        onTaskUpdated={handleTaskUpdated}
        isAdmin={userIsAdmin}
        session={session}
      />

      <Suspense fallback={null}>
        <AddTaskModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onTaskAdded={loadTasks}
          allRoles={allRoles}
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

        <ShiftModal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          task={selectedTask}
          onConfirm={handleShiftConfirm}
          language={language}
        />

        <RebaselineModal
          isOpen={isRebaselineModalOpen}
          onClose={() => setIsRebaselineModalOpen(false)}
          onConfirm={handleRebaselineConfirm}
          language={language}
        />

        <ProjectSettingsModal
          isOpen={isProjectSettingsOpen}
          onClose={() => setIsProjectSettingsOpen(false)}
          project={project}
          onSave={handleProjectSettingsSave}
          language={language}
          onInvite={() => setIsInviteModalOpen(true)}
          canManage={canManage}
        />

        <InvitationManager
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          allRoles={allRoles}
        />

        <AdminPanel
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ProjectOperationsModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
            setProjectToRename(null);
          }}
          mode={projectModalMode}
          currentName={projectToRename ? projects.find(p => p.id === projectToRename)?.name : ''}
          onSubmit={(name, description) => {
            if (projectModalMode === 'create') {
              handleCreateProject(name, description);
            } else {
              handleRenameProject(name);
            }
          }}
        />
      </Suspense>
    </div>
  );
}

export default App;
