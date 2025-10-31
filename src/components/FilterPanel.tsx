import { Role, TaskStatus, ROLES, TASK_STATUSES } from '../types';
import { Filter } from 'lucide-react';

interface FilterPanelProps {
  selectedStatuses: TaskStatus[];
  selectedRoles: Role[];
  selectedMonths: string[];
  availableMonths: string[];
  onStatusToggle: (status: TaskStatus) => void;
  onRoleToggle: (role: Role) => void;
  onMonthToggle: (month: string) => void;
  onClearFilters: () => void;
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
}: FilterPanelProps) {
  const hasActiveFilters =
    selectedStatuses.length > 0 || selectedRoles.length > 0 || selectedMonths.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-700" />
          <h2 className="font-semibold text-slate-900">Filters</h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Status:</span>
            <div className="flex gap-2">
              {TASK_STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => onStatusToggle(status)}
                    className="w-4 h-4 text-slate-700 border-slate-300 rounded focus:ring-slate-400"
                  />
                  <span className="text-sm text-slate-600">{status}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-slate-300" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Role:</span>
            <div className="flex gap-2 flex-wrap">
              {ROLES.map((role) => (
                <label key={role} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => onRoleToggle(role)}
                    className="w-4 h-4 text-slate-700 border-slate-300 rounded focus:ring-slate-400"
                  />
                  <span className="text-sm text-slate-600">{role}</span>
                </label>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <>
              <div className="h-6 w-px bg-slate-300" />
              <button
                onClick={onClearFilters}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium underline"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
