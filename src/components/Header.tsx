import { memo } from 'react';
import { Settings, RefreshCw, UserPlus, LogOut, User as UserIcon } from 'lucide-react';
import { Language, useTranslation } from '../lib/i18n';
import InstallPrompt from './InstallPrompt';
import { UserProfile } from '../lib/auth';

interface HeaderProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  onAddTask: () => void;
  onRebaseline: () => void;
  onProjectSettings: () => void;
  onInvite: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  projectName: string;
  projectDescription: string;
  allRoles: string[];
  userProfile: UserProfile | null;
  onSignOut: () => void;
}

export const Header = memo(function Header({ currentRole, onRoleChange, onAddTask, onRebaseline, onProjectSettings, onInvite, language, onLanguageChange, projectName, projectDescription, allRoles, userProfile, onSignOut }: HeaderProps) {
  const t = useTranslation(language);
  const canManage = currentRole === 'Project Manager' || currentRole === 'Developer';
  return (
    <header className="glass-effect border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
            <button
              onClick={onProjectSettings}
              className="flex items-center gap-2 sm:gap-3 hover:bg-white/60 active:bg-white/80 px-3 py-3 rounded-xl transition-all duration-200 min-w-0 group"
              title={t.projectSettings}
              style={{ minHeight: '44px' }}
            >
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-200">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent truncate">
                {projectName}
              </h1>
            </button>
            {projectDescription && (
              <div className="hidden lg:block text-sm text-slate-600 border-l border-slate-300 pl-6 truncate">
                {projectDescription}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <InstallPrompt />

            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="input-modern text-xs sm:text-sm font-medium py-2 px-3"
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>

            {userProfile ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200">
                  <UserIcon className="w-4 h-4 text-slate-600" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-900">{userProfile.full_name}</span>
                    <span className="text-xs text-slate-600">{userProfile.role}</span>
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  className="btn-secondary px-3 py-2 text-sm"
                  title="Sign Out"
                  style={{ minHeight: '44px' }}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <select
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value)}
                className="hidden sm:block input-modern text-sm font-medium py-2 px-3 max-w-[160px]"
              >
                {allRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            )}

            {canManage && (
              <>
                <button
                  onClick={onInvite}
                  className="hidden md:flex btn-secondary px-4 py-2 text-sm items-center gap-2"
                  title={language === 'fr' ? 'Inviter des entrepreneurs' : 'Invite Contractors'}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Inviter' : 'Invite'}</span>
                </button>

                <button
                  onClick={onRebaseline}
                  className="hidden lg:flex btn-secondary px-4 py-2 text-sm items-center gap-2"
                  title={language === 'fr' ? 'Recalibrer le projet' : 'Rebaseline Project'}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Recalibrer' : 'Rebaseline'}</span>
                </button>
              </>
            )}

            <button
              onClick={onAddTask}
              className="btn-primary px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base whitespace-nowrap"
            >
              <span className="hidden sm:inline">+ {t.addTask}</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});
