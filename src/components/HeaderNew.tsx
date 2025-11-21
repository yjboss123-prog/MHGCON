import { memo, useState, useRef, useEffect } from 'react';
import { Settings, List, BarChart3, ChevronDown, Lock, Archive, Trash2, ArchiveRestore, Edit2, Copy, MoreVertical } from 'lucide-react';
import { Language } from '../lib/i18n';
import InstallPrompt from './InstallPrompt';
import { Session } from '../lib/session';
import { Project } from '../types';

type ViewMode = 'list' | 'gantt';

interface HeaderProps {
  onAddTask: () => void;
  onSettings: () => void;
  language: Language;
  projectName: string;
  userSession: Session | null;
  onSwitchCode: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  projects?: Project[];
  activeProjectId?: string;
  onProjectChange?: (projectId: string) => void;
  onCreateProject?: () => void;
  onRenameProject?: (projectId: string) => void;
  onDuplicateProject?: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onUnarchiveProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  showArchived?: boolean;
  onToggleShowArchived?: () => void;
  canManage?: boolean;
}

export const HeaderNew = memo(function HeaderNew({
  onAddTask,
  onSettings,
  language,
  projectName,
  userSession,
  onSwitchCode,
  viewMode = 'list',
  onViewModeChange,
  projects = [],
  activeProjectId,
  onProjectChange,
  onCreateProject,
  onRenameProject,
  onDuplicateProject,
  onArchiveProject,
  onUnarchiveProject,
  onDeleteProject,
  showArchived = false,
  onToggleShowArchived,
  canManage = false,
}: HeaderProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [projectActionMenuId, setProjectActionMenuId] = useState<string | null>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(false);
        setProjectActionMenuId(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowRoleMenu(false);
        setShowProjectMenu(false);
        setProjectActionMenuId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const roleDisplayName = userSession?.contractor_role || userSession?.role || 'User';
  const roleLabel = roleDisplayName.charAt(0).toUpperCase() + roleDisplayName.slice(1);

  return (
    <>
      <header className="glass-effect border-b border-slate-200/60 fixed top-0 left-0 right-0 z-50 pt-safe animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-0 sm:h-16">
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
              {projects.length > 0 && onProjectChange ? (
                <div className="relative" ref={projectMenuRef}>
                  <button
                    onClick={() => setShowProjectMenu(!showProjectMenu)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-white/70 rounded-xl transition-smooth shadow-sm hover:shadow min-w-[120px]"
                    style={{ minHeight: '44px' }}
                  >
                    <span className="font-semibold text-slate-900 truncate">{projectName}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  </button>

                  {showProjectMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 min-w-[200px] max-h-[300px] overflow-y-auto z-[100] animate-scale-in">
                      {projects.map((proj) => (
                        <div key={proj.id}>
                          <div className="flex items-center group">
                            <button
                              onClick={() => {
                                onProjectChange(proj.id);
                                setShowProjectMenu(false);
                              }}
                              className={`flex-1 text-left px-4 py-2 hover:bg-slate-50 transition-colors ${
                                proj.id === activeProjectId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                              } ${proj.archived ? 'opacity-60 italic' : ''}`}
                            >
                              <div className="flex items-center gap-2">
                                {proj.archived && <Archive className="w-3.5 h-3.5" />}
                                <span>{proj.name}</span>
                              </div>
                            </button>
                            {canManage && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectActionMenuId(projectActionMenuId === proj.id ? null : proj.id);
                                }}
                                className="px-2 py-2 hover:bg-slate-100 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                              </button>
                            )}
                          </div>
                          {projectActionMenuId === proj.id && canManage && (
                            <div className="bg-slate-50 px-2 py-1 border-t border-b border-slate-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRenameProject?.(proj.id);
                                  setProjectActionMenuId(null);
                                  setShowProjectMenu(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-white rounded flex items-center gap-2"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateProject?.(proj.id);
                                  setProjectActionMenuId(null);
                                  setShowProjectMenu(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-white rounded flex items-center gap-2"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                Duplicate
                              </button>
                              {!proj.archived ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onArchiveProject?.(proj.id);
                                    setProjectActionMenuId(null);
                                    setShowProjectMenu(false);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-white rounded flex items-center gap-2"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  Archive
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUnarchiveProject?.(proj.id);
                                    setProjectActionMenuId(null);
                                    setShowProjectMenu(false);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-white rounded flex items-center gap-2"
                                >
                                  <ArchiveRestore className="w-3.5 h-3.5" />
                                  Unarchive
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteProject?.(proj.id);
                                  setProjectActionMenuId(null);
                                  setShowProjectMenu(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {(onCreateProject || onToggleShowArchived) && (
                        <div className="border-t border-slate-200 my-2" />
                      )}
                      {onCreateProject && canManage && (
                        <button
                          onClick={() => {
                            onCreateProject();
                            setShowProjectMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors text-blue-600 font-semibold"
                        >
                          + New Project
                        </button>
                      )}
                      {onToggleShowArchived && canManage && (
                        <button
                          onClick={() => {
                            onToggleShowArchived();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-slate-700 text-sm flex items-center gap-2"
                        >
                          <Archive className="w-4 h-4" />
                          {showArchived ? 'Hide Archived' : 'Show Archived'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <h1 className="font-bold text-lg sm:text-xl text-slate-900">{projectName}</h1>
              )}

              {onViewModeChange && (
                <div className="hidden sm:flex gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => onViewModeChange('list')}
                    className={`px-3 py-2 rounded-md transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={language === 'fr' ? 'Vue Liste' : 'List View'}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onViewModeChange('gantt')}
                    className={`px-3 py-2 rounded-md transition-all ${
                      viewMode === 'gantt'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={language === 'fr' ? 'Vue Gantt' : 'Gantt View'}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
              {onViewModeChange && (
                <div className="flex sm:hidden gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => onViewModeChange('list')}
                    className={`px-3 py-2 rounded-md transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={language === 'fr' ? 'Vue Liste' : 'List View'}
                    style={{ minHeight: '44px' }}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onViewModeChange('gantt')}
                    className={`px-3 py-2 rounded-md transition-all ${
                      viewMode === 'gantt'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={language === 'fr' ? 'Vue Gantt' : 'Gantt View'}
                    style={{ minHeight: '44px' }}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <InstallPrompt />

              {userSession && (
                <div className="relative" ref={roleMenuRef}>
                  <button
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
                    style={{ minHeight: '44px' }}
                  >
                    <span className="text-xs font-semibold text-slate-900">{roleLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {showRoleMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 py-2 min-w-[180px]">
                      <div className="px-4 py-2 border-b border-slate-200">
                        <div className="text-xs font-semibold text-slate-900">{userSession.display_name}</div>
                        <div className="text-xs text-slate-600">{roleLabel}</div>
                      </div>
                      <button
                        onClick={() => {
                          onSwitchCode();
                          setShowRoleMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Changer de code' : 'Switch Code'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onSettings}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-smooth"
                title={language === 'fr' ? 'Paramètres' : 'Settings'}
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <Settings className="w-5 h-5 text-slate-600" />
              </button>

              <button
                onClick={onAddTask}
                className="btn-primary px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold whitespace-nowrap"
                style={{ minHeight: '44px' }}
              >
                <span className="hidden sm:inline">+ {language === 'fr' ? 'Ajouter' : 'Add Task'}</span>
                <span className="sm:hidden">+</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <div style={{ height: 'calc(5rem + env(safe-area-inset-top))' }} className="sm:hidden" />
      <div style={{ height: 'calc(4rem + env(safe-area-inset-top))' }} className="hidden sm:block" />
    </>
  );
});
