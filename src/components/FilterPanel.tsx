import { useState } from 'react';
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

export function FilterPanel({
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
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">{t.filters}</h2>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-700 text-white text-xs font-bold rounded-full">
                {selectedStatuses.length + selectedRoles.length + selectedMonths.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 font-medium underline"
              >
                {t.clearAll}
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="sm:hidden p-1 hover:bg-slate-100 rounded"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className={`${isExpanded ? 'block' : 'hidden'} sm:block mt-3 sm:mt-4 space-y-3`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm font-medium text-slate-700 flex-shrink-0">{t.status}:</span>
            <div className="flex flex-wrap gap-2">
              {TASK_STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => onStatusToggle(status)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 border-slate-300 rounded focus:ring-slate-400"
                  />
                  <span className="text-xs sm:text-sm text-slate-600">{translateStatus(status, language)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm font-medium text-slate-700 flex-shrink-0">{t.role}:</span>
            <div className="flex flex-wrap gap-2">
              {allRoles.map((role) => (
                <label key={role} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => onRoleToggle(role)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 border-slate-300 rounded focus:ring-slate-400"
                  />
                  <span className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">{translateRole(role, language)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
