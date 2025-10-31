import { Role, ROLES } from '../types';
import { Settings, RefreshCw } from 'lucide-react';
import { Language, useTranslation } from '../lib/i18n';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  onAddTask: () => void;
  onRebaseline: () => void;
  onProjectSettings: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  projectName: string;
  projectDescription: string;
}

export function Header({ currentRole, onRoleChange, onAddTask, onRebaseline, onProjectSettings, language, onLanguageChange, projectName, projectDescription }: HeaderProps) {
  const t = useTranslation(language);
  const canManage = currentRole === 'Project Manager' || currentRole === 'Developer';
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={onProjectSettings}
              className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors"
              title={t.projectSettings}
            >
              <Settings className="w-6 h-6 text-slate-700" />
              <h1 className="text-xl font-bold text-slate-900">{projectName}</h1>
            </button>
            {projectDescription && (
              <div className="hidden sm:block text-sm text-slate-500 border-l border-slate-200 pl-4">
                {projectDescription}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>

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

            {canManage && (
              <button
                onClick={onRebaseline}
                className="px-3 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                title={language === 'fr' ? 'Recalibrer le projet' : 'Rebaseline Project'}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden md:inline">{language === 'fr' ? 'Recalibrer' : 'Rebaseline'}</span>
              </button>
            )}

            <button
              onClick={onAddTask}
              className="px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              + {t.addTask}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
