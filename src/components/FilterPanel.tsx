import { memo, useMemo } from 'react';
import { Filter, Calendar, Users, CheckCircle2 } from 'lucide-react';
import { Language, useTranslation } from '../lib/i18n';
import { TASK_STATUSES, TaskStatus } from '../types';

export type MonthOption = {
  key: string;
  label: string;
};

interface FilterPanelProps {
  selectedStatuses: string[];
  selectedRoles: string[];
  selectedMonths: string[];
  availableMonths: MonthOption[];
  onStatusToggle: (status: string) => void;
  onRoleToggle: (role: string) => void;
  onMonthToggle: (month: string) => void;
  onClearFilters: () => void;
  language: Language;
  allRoles: string[];
  isContractor?: boolean;
}

const statusBadgeStyles: Record<TaskStatus, string> = {
  'On Track': 'bg-slate-900 text-white border-slate-900 shadow-slate-500/40',
  Delayed: 'bg-amber-500/10 text-amber-600 border-amber-300',
  Blocked: 'bg-red-500/10 text-red-600 border-red-300',
  Done: 'bg-emerald-500/10 text-emerald-600 border-emerald-300',
};

export const FilterPanel = memo(function FilterPanel({
  selectedStatuses,
  selectedRoles,
  selectedMonths,
  availableMonths,
  onStatusToggle,
  onRoleToggle,
  onMonthToggle,
  onClearFilters,
  language,
  allRoles,
  isContractor = false,
}: FilterPanelProps) {
  const t = useTranslation(language);

  const statusLabels = useMemo(
    () => ({
      'On Track': t.onTrack,
      Delayed: t.delayed,
      Blocked: t.blocked,
      Done: t.done,
    }),
    [t]
  );

  const hasFilters =
    selectedStatuses.length > 0 || selectedRoles.length > 0 || selectedMonths.length > 0;

  const roleOptions = useMemo(
    () => (isContractor ? allRoles.filter((role) => role !== 'Project Manager') : allRoles),
    [allRoles, isContractor]
  );

  return (
    <aside className="card-modern border border-slate-200/80 p-4 sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="w-4 h-4" />
          <h2 className="text-sm sm:text-base font-semibold uppercase tracking-wide">{t.filters}</h2>
        </div>
        <button
          type="button"
          onClick={onClearFilters}
          disabled={!hasFilters}
          className={`text-xs sm:text-sm font-medium transition-colors hover:text-slate-900 ${
            hasFilters ? 'text-slate-600' : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          {t.clearAll}
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 text-slate-700 mb-3">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">{t.status}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {TASK_STATUSES.map((status) => {
              const isActive = selectedStatuses.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusToggle(status)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all min-w-[44px] ${
                    isActive
                      ? statusBadgeStyles[status]
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  aria-pressed={isActive}
                >
                  {statusLabels[status]}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 text-slate-700 mb-3">
            <Users className="w-4 h-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">{t.role}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {roleOptions.map((role) => {
              const isActive = selectedRoles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => onRoleToggle(role)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all min-w-[44px] ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/40 shadow'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  aria-pressed={isActive}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </section>

        {availableMonths.length > 0 && (
          <section>
            <div className="flex items-center gap-2 text-slate-700 mb-3">
              <Calendar className="w-4 h-4" />
              <h3 className="text-sm font-semibold uppercase tracking-wide">{t.month}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableMonths.map((month) => {
                const isActive = selectedMonths.includes(month.key);
                return (
                  <button
                    key={month.key}
                    type="button"
                    onClick={() => onMonthToggle(month.key)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all min-w-[44px] ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-slate-500/40 shadow'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                    aria-pressed={isActive}
                  >
                    {month.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
});
