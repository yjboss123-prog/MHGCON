import { Role } from '../types';
import { Settings, RefreshCw } from 'lucide-react';
import { Language, useTranslation } from '../lib/i18n';

interface HeaderProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  onAddTask: () => void;
  onRebaseline: () => void;
  onProjectSettings: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  projectName: string;
  projectDescription: string;
  allRoles: string[];
}

export function Header({ currentRole, onRoleChange, onAddTask, onRebaseline, onProjectSettings, language, onLanguageChange, projectName, projectDescription, allRoles }: HeaderProps) {
  const t = useTranslation(language);
  const canManage = currentRole === 'Project Manager' || currentRole === 'Developer';
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={onProjectSettings}
              className="flex items-center gap-1 sm:gap-2 hover:bg-slate-50 px-1 sm:px-2 py-1 rounded-lg transition-colors min-w-0"
              title={t.projectSettings}
            >
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 flex-shrink-0" />
              <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">{projectName}</h1>
            </button>
            {projectDescription && (
              <div className="hidden lg:block text-sm text-slate-500 border-l border-slate-200 pl-4 truncate">
                {projectDescription}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>

            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="hidden sm:block px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white max-w-[140px]"
            >
              {allRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {canManage && (
              <button
                onClick={onRebaseline}
                className="hidden sm:flex px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors items-center gap-1 sm:gap-2"
                title={language === 'fr' ? 'Recalibrer le projet' : 'Rebaseline Project'}
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">{language === 'fr' ? 'Recalibrer' : 'Rebaseline'}</span>
              </button>
            )}

            <button
              onClick={onAddTask}
              className="px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-700 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">+ {t.addTask}</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
