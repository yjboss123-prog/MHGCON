import { useState, memo } from 'react';
import { TaskStatus, TASK_STATUSES } from '../types';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Language, useTranslation, translateRole, translateStatus } from '../lib/i18n';

interface FilterPanelProps {
  selectedStatuses: TaskStatus[];
  selectedRoles: string[];
  selectedMonths: string[];
  availableMonths: string[];
  onStatusToggle: (status: TaskStatus) => void;
  onRoleToggle: (role: string) => void;
  onMonthToggle: (month: string) => void;
  onClearFilters: () => void;
  language: Language;
  allRoles: string[];
}

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
}: FilterPanelProps) {
  const t = useTranslation(language);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActiveFilters =
    selectedStatuses.length > 0 || selectedRoles.length > 0 || selectedMonths.length > 0;

  return (
    <div className="card-modern">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg shadow-lg">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{t.filters}</h2>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-500/30">
                {selectedStatuses.length + selectedRoles.length + selectedMonths.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                {t.clearAll}
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="sm:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className={`${isExpanded ? 'block' : 'hidden'} sm:block mt-5 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-sm font-semibold text-slate-900 flex-shrink-0">{t.status}:</span>
            <div className="flex flex-wrap gap-2">
              {TASK_STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => onStatusToggle(status)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 font-medium">{translateStatus(status, language)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <span className="text-sm font-semibold text-slate-900 flex-shrink-0">{t.role}:</span>
            <div className="flex flex-wrap gap-2">
              {allRoles.map((role) => (
                <label key={role} className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => onRoleToggle(role)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 font-medium whitespace-nowrap">{translateRole(role, language)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
