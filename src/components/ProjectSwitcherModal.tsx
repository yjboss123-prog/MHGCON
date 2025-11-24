import { memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp } from 'lucide-react';
import { Project, Task } from '../types';
import { useAnimatedToggle } from '../lib/useAnimatedToggle';
import { Session, isElevated } from '../lib/session';

interface ProjectSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject?: Project;
  allProjects: Project[];
  tasks: Task[];
  onProjectChange: (projectId: string) => void;
  session: Session | null;
}

function calculateProjectProgress(projectId: string, tasks: Task[]): number {
  const projectTasks = tasks.filter(t => t.project_id === projectId);
  if (projectTasks.length === 0) return 0;

  const totalProgress = projectTasks.reduce((sum, task) => sum + (task.percent_done || 0), 0);
  return Math.round(totalProgress / projectTasks.length);
}

function calculateProjectBudget(projectId: string, tasks: Task[]): { spent: number; total: number } {
  const projectTasks = tasks.filter(t => t.project_id === projectId);

  const spent = projectTasks.reduce((sum, task) => {
    if (!task.budget) return sum;
    const budgetAmount = typeof task.budget === 'number' ? task.budget : 0;
    const progress = (task.percent_done || 0) / 100;
    return sum + (budgetAmount * progress);
  }, 0);

  const total = projectTasks.reduce((sum, task) => {
    const budgetAmount = typeof task.budget === 'number' ? task.budget : 0;
    return sum + budgetAmount;
  }, 0);

  return { spent, total };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const ProjectSwitcherModal = memo(function ProjectSwitcherModal({
  isOpen,
  onClose,
  currentProject,
  allProjects,
  tasks,
  onProjectChange,
  session
}: ProjectSwitcherModalProps) {
  const { show, closing, setOpen } = useAnimatedToggle(isOpen);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(onClose, 180);
  }, [setOpen, onClose]);

  const handleProjectSelect = useCallback((projectId: string) => {
    onProjectChange(projectId);
    handleClose();
  }, [onProjectChange, handleClose]);

  const showBudget = session && isElevated(session);

  if (!show && !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[3000]" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        style={{ animation: `${closing ? 'fadeOut' : 'fadeIn'} 0.2s ease` }}
        onClick={handleClose}
        aria-label="Close project switcher"
      />

      <div
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
        style={{
          animation: `${closing ? 'sheetOut' : 'sheetIn'} 0.2s ease`,
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))'
        }}
      >
        <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-slate-900">Switch Project</h2>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <p className="text-sm text-slate-600">
            {allProjects.length} project{allProjects.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3 pb-2">
            {allProjects.map((project) => {
              const progress = calculateProjectProgress(project.id, tasks);
              const budget = calculateProjectBudget(project.id, tasks);
              const isActive = project.id === currentProject?.id;

              return (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                    isActive
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 shadow-sm'
                  }`}
                  style={{
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base font-semibold mb-0.5 ${
                        isActive ? 'text-emerald-900' : 'text-slate-900'
                      }`}>
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className={`text-sm ${
                          isActive ? 'text-emerald-700' : 'text-slate-600'
                        } line-clamp-1`}>
                          {project.description}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <div className="flex-shrink-0 ml-3 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-white text-lg font-bold leading-none">✓</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                        <span className={isActive ? 'text-emerald-700' : 'text-slate-600'}>
                          Progress
                        </span>
                        <span className={`font-semibold ${isActive ? 'text-emerald-900' : 'text-slate-900'}`}>
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-2 transition-all ${
                            isActive ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {showBudget && budget.total > 0 && (
                      <div className={`flex items-center gap-2 text-xs ${
                        isActive ? 'text-emerald-700' : 'text-slate-600'
                      }`}>
                        <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.total)}
                        </span>
                        <span className="text-xs opacity-75">
                          ({Math.round((budget.spent / budget.total) * 100)}% spent)
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});
