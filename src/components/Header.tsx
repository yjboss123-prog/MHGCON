import { memo } from 'react';
import { Settings, RefreshCw, UserPlus, LogOut, User as UserIcon, Shield, Lock } from 'lucide-react';
import { Language, useTranslation } from '../lib/i18n';
import InstallPrompt from './InstallPrompt';
import { Session } from '../lib/session';
import { isManagerRole } from '../lib/utils';

interface HeaderProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  onAddTask: () => void;
  onRebaseline: () => void;
  onProjectSettings: () => void;
  onInvite: () => void;
  onAdminPanel?: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  projectName: string;
  projectDescription: string;
  allRoles: string[];
  userSession: Session | null;
  onSignOut: () => void;
  onSwitchCode: () => void;
}

export const Header = memo(function Header({ currentRole, onRoleChange, onAddTask, onRebaseline, onProjectSettings, onInvite, onAdminPanel, language, onLanguageChange, projectName, projectDescription, allRoles, userSession, onSignOut, onSwitchCode }: HeaderProps) {
  const t = useTranslation(language);
  const canManage = isManagerRole(currentRole);
  return (
    <>
      <header
        className="glass-effect border-b border-slate-200/50 fixed top-0 left-0 right-0 z-50"
        style={{ paddingTop: 'max(env(safe-area-inset-top), constant(safe-area-inset-top))' }}
      >
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

            {userSession && (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200 shadow-sm">
                    <UserIcon className="w-4 h-4 text-slate-600" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-900">{userSession.display_name}</span>
                      <span className="text-xs text-slate-600 font-medium">
                        {userSession.contractor_role || currentRole}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onSwitchCode}
                    className="btn-secondary px-3 py-2 text-xs flex items-center gap-2"
                    title="Switch Access Code"
                    style={{ minHeight: '44px' }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Switch</span>
                  </button>
                </div>
                <button
                  onClick={onSignOut}
                  className="btn-secondary px-3 py-2 text-sm sm:hidden"
                  title="Sign Out"
                  style={{ minHeight: '44px' }}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}

            {userSession?.role === 'admin' && onAdminPanel && (
              <button
                onClick={onAdminPanel}
                className="btn-secondary px-3 py-2 text-sm"
                title="Admin Panel"
                style={{ minHeight: '44px' }}
              >
                <Shield className="w-4 h-4" />
              </button>
            )}

            {canManage && (
              <>
                <button
                  onClick={onInvite}
                  className="hidden md:flex btn-secondary px-4 py-2 text-sm items-center gap-2"
                  title={t.inviteContractors}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Inviter' : 'Invite'}</span>
                </button>

                <button
                  onClick={onRebaseline}
                  className="hidden lg:flex btn-secondary px-4 py-2 text-sm items-center gap-2"
                  title={t.rebaselineProject}
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
      <div style={{ height: 'calc(4rem + max(env(safe-area-inset-top), constant(safe-area-inset-top)))' }} className="sm:hidden" />
      <div style={{ height: 'calc(5rem + max(env(safe-area-inset-top), constant(safe-area-inset-top)))' }} className="hidden sm:block" />
    </>
  );
});
