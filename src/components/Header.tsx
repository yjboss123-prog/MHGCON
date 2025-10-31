import { Role, ROLES } from '../types';
import { Settings } from 'lucide-react';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  onAddTask: () => void;
  canManageTasks: boolean;
}

export function Header({ currentRole, onRoleChange, onAddTask, canManageTasks }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-slate-700" />
              <h1 className="text-xl font-bold text-slate-900">MHG Tracker</h1>
            </div>
            <div className="hidden sm:block text-sm text-slate-500 border-l border-slate-200 pl-4">
              SEBN Bouknadel – EXT 01/02
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as Role)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {canManageTasks && (
              <button
                onClick={onAddTask}
                className="px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                + Add Task
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
