import { memo, useMemo } from 'react';
import { Task } from '../types';
import { DollarSign, Lock } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Session } from '../lib/session';
import { canViewProjectBudget } from '../lib/budgetVisibility';

interface ProjectFinanceSummaryProps {
  tasks: Task[];
  language: 'en' | 'fr';
  session: Session | null;
}

export const ProjectFinanceSummary = memo(function ProjectFinanceSummary({
  tasks,
  language,
  session
}: ProjectFinanceSummaryProps) {
  const finances = useMemo(() => {
    const projectBudget = tasks.reduce((sum, task) => sum + (task.budget || 0), 0);
    const projectEarned = tasks.reduce((sum, task) => {
      const taskBudget = task.budget || 0;
      const taskEarned = (taskBudget * task.percent_done) / 100;
      return sum + taskEarned;
    }, 0);
    const projectPercentComplete = projectBudget > 0
      ? (projectEarned / projectBudget) * 100
      : 0;
    const projectRemaining = projectBudget - projectEarned;

    return {
      budget: projectBudget,
      earned: projectEarned,
      percentComplete: projectPercentComplete,
      remaining: projectRemaining
    };
  }, [tasks]);

  const canViewBudget = canViewProjectBudget(session);

  if (finances.budget === 0) return null;

  if (!canViewBudget) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-600">
            {language === 'fr' ? 'Budget du Projet' : 'Project Budget'}
          </h3>
        </div>
        <p className="text-sm text-slate-500">
          {language === 'fr'
            ? 'Le résumé financier du projet n\'est pas disponible pour ce rôle.'
            : 'Project financial summary unavailable for this role.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          {language === 'fr' ? 'Budget du Projet' : 'Project Budget'}
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">
            {language === 'fr' ? 'Budget' : 'Budget'}
          </div>
          <div className="text-lg font-bold text-slate-900">
            ${formatCurrency(finances.budget)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">
            {language === 'fr' ? 'Gagné' : 'Earned'}
          </div>
          <div className="text-lg font-bold text-emerald-600">
            ${formatCurrency(finances.earned)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">
            {language === 'fr' ? '% Complet' : '% Complete'}
          </div>
          <div className="text-lg font-bold text-blue-600">
            {finances.percentComplete.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">
            {language === 'fr' ? 'Restant' : 'Remaining'}
          </div>
          <div className="text-lg font-bold text-slate-900">
            ${formatCurrency(finances.remaining)}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
            style={{ width: `${Math.min(finances.percentComplete, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
});
