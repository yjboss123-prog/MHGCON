import { useState } from 'react';
import { Plus, MoreVertical, Archive, Copy, Edit2, Trash2, ArchiveRestore, FolderOpen } from 'lucide-react';
import { Project } from '../types';

interface ProjectTabsProps {
  projects: Project[];
  activeProjectId: string;
  onProjectChange: (projectId: string) => void;
  onCreateProject: () => void;
  onRenameProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onArchiveProject: (projectId: string) => void;
  onUnarchiveProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  canManage: boolean;
}

export function ProjectTabs({
  projects,
  activeProjectId,
  onProjectChange,
  onCreateProject,
  onRenameProject,
  onDuplicateProject,
  onArchiveProject,
  onUnarchiveProject,
  onDeleteProject,
  showArchived,
  onToggleShowArchived,
  canManage
}: ProjectTabsProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleMenuToggle = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === projectId ? null : projectId);
  };

  const handleMenuAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setOpenMenuId(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-[1500]" style={{ overflow: 'visible', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8" style={{ overflow: 'visible' }}>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 min-h-[64px]" style={{ overflowY: 'visible' }}>
          {projects.map((project) => (
            <div key={project.id} className="relative flex-shrink-0 group" style={{ overflow: 'visible', position: 'static' }}>
              <button
                onClick={() => onProjectChange(project.id)}
                className={`
                  flex items-center justify-center gap-2 px-4 h-11 rounded-xl transition-all duration-200
                  ${activeProjectId === project.id
                    ? 'bg-slate-100 text-slate-900 font-medium border-2 border-blue-500'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-2 border-transparent'
                  }
                  ${project.archived ? 'opacity-60 italic' : ''}
                `}
                style={{ minHeight: '44px' }}
              >
                {project.archived && <Archive className="w-3.5 h-3.5" />}
                <span className="text-sm whitespace-nowrap max-w-[200px] truncate">
                  {project.name}
                </span>
                {canManage && (
                  <button
                    onClick={(e) => handleMenuToggle(e, project.id)}
                    className="p-0.5 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                )}
              </button>

              {openMenuId === project.id && canManage && (
                <>
                  <div
                    className="fixed inset-0 z-[1501]"
                    onClick={() => setOpenMenuId(null)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-[2000]">
                    <button
                      onClick={(e) => handleMenuAction(e, () => onRenameProject(project.id))}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Rename
                    </button>
                    <button
                      onClick={(e) => handleMenuAction(e, () => onDuplicateProject(project.id))}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    {!project.archived ? (
                      <button
                        onClick={(e) => handleMenuAction(e, () => onArchiveProject(project.id))}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Archive className="w-4 h-4" />
                        Archive
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleMenuAction(e, () => onUnarchiveProject(project.id))}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                        Unarchive
                      </button>
                    )}
                    <div className="border-t border-slate-200 my-1" />
                    <button
                      onClick={(e) => handleMenuAction(e, () => onDeleteProject(project.id))}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {canManage && (
            <>
              <button
                onClick={onCreateProject}
                className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 h-11 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                style={{ minHeight: '44px' }}
                title="Create new project"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </button>

              <button
                onClick={onToggleShowArchived}
                className={`
                  flex-shrink-0 flex items-center justify-center gap-1.5 px-3 h-11 text-sm rounded-xl transition-colors ml-2
                  ${showArchived
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
                style={{ minHeight: '44px' }}
                title={showArchived ? 'Hide archived' : 'Show archived'}
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {showArchived ? 'Hide' : 'Show'} Archived
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
