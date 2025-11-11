import { useState } from 'react';
import { X, Building2, CheckSquare, Users, Eye, Bell, Download, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { Language } from '../lib/i18n';
import { Session } from '../lib/session';
import { Project, Task } from '../types';

type SettingsTab = 'project' | 'tasks' | 'access' | 'display' | 'notifications' | 'data' | 'advanced';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  project: Project | null;
  session: Session | null;
  onProjectSettings: () => void;
  onInvite: () => void;
  onRebaseline: () => void;
  onAdminPanel?: () => void;
  onSignOut: () => void;
  tasks?: Task[];
  onDeleteTask?: (task: Task) => void;
};

export function SettingsModal({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  project,
  session,
  onProjectSettings,
  onInvite,
  onRebaseline,
  onAdminPanel,
  onSignOut,
  tasks = [],
  onDeleteTask,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('project');

  if (!isOpen) return null;

  const isAdmin = session?.role === 'admin';
  const isManager = session?.role === 'admin' || session?.role === 'project_manager';

  const tabs: { id: SettingsTab; label: string; labelFr: string; icon: typeof Building2 }[] = [
    { id: 'project', label: 'Project', labelFr: 'Projet', icon: Building2 },
    { id: 'tasks', label: 'Tasks', labelFr: 'Tâches', icon: CheckSquare },
    { id: 'access', label: 'Access & Roles', labelFr: 'Accès & Rôles', icon: Users },
    { id: 'display', label: 'Display', labelFr: 'Affichage', icon: Eye },
    { id: 'notifications', label: 'Notifications', labelFr: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Export', labelFr: 'Données & Export', icon: Download },
    { id: 'advanced', label: 'Advanced', labelFr: 'Avancé', icon: SettingsIcon },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {language === 'fr' ? 'Paramètres' : 'Settings'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r border-slate-200 p-4 space-y-1 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{language === 'fr' ? tab.labelFr : tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'project' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {language === 'fr' ? 'Configuration du Projet' : 'Project Configuration'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Nom du projet' : 'Project Name'}
                      </label>
                      <p className="text-slate-900 font-semibold">{project?.name || 'MHG Tracker'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Année' : 'Year'}
                      </label>
                      <p className="text-slate-900">2026</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Langue' : 'Language'}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => onLanguageChange(e.target.value as Language)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>

                    {isManager && (
                      <>
                        <div className="pt-4 border-t border-slate-200">
                          <button
                            onClick={() => {
                              onClose();
                              onProjectSettings();
                            }}
                            className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                          >
                            {language === 'fr' ? 'Modifier les détails du projet' : 'Edit Project Details'}
                          </button>
                        </div>

                        <div>
                          <button
                            onClick={() => {
                              onClose();
                              onRebaseline();
                            }}
                            className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                          >
                            {language === 'fr' ? 'Recalibrer le projet' : 'Rebaseline Project'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {language === 'fr' ? 'Configuration des Tâches' : 'Task Configuration'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Modèle de tâches par défaut' : 'Default Task Template'}
                      </label>
                      <p className="text-sm text-slate-600 mb-3">
                        {language === 'fr'
                          ? '13 tâches standard pour chaque nouveau projet'
                          : '13 standard tasks for each new project'}
                      </p>
                      <div className="bg-slate-50 rounded-lg p-4 space-y-1 text-sm text-slate-700">
                        <div>1. Installation de chantier</div>
                        <div>2. Terrassement</div>
                        <div>3. Fondations production</div>
                        <div>4. Charpente métallique</div>
                        <div>5. Couverture & bardage</div>
                        <div>6. Dallage</div>
                        <div>7. Fondations administration/social</div>
                        <div>8. Élévation</div>
                        <div>9. Plancher</div>
                        <div>10. Équipements industriels</div>
                        <div>11. Lots architecturaux</div>
                        <div>12. Lots techniques</div>
                        <div>13. Aménagement extérieur</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Contraintes' : 'Constraints'}
                      </label>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{language === 'fr' ? 'Limité à Jan–Déc 2026' : 'Clamped to Jan–Dec 2026'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{language === 'fr' ? '4 semaines fixes par mois' : '4 fixed weeks per month'}</span>
                        </div>
                      </div>
                    </div>

                    {isManager && tasks.length > 0 && onDeleteTask && (
                      <div className="pt-4 border-t border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          {language === 'fr' ? 'Gestion des Tâches' : 'Task Management'}
                        </label>
                        <p className="text-sm text-slate-600 mb-4">
                          {language === 'fr'
                            ? 'Supprimer des tâches de ce projet'
                            : 'Remove tasks from this project'}
                        </p>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {tasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 truncate">
                                  {task.name}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {new Date(task.start_date).toLocaleDateString()} - {new Date(task.end_date).toLocaleDateString()}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const confirmMsg = language === 'fr'
                                    ? `Supprimer "${task.name}" ?`
                                    : `Delete "${task.name}"?`;
                                  if (window.confirm(confirmMsg)) {
                                    onDeleteTask(task);
                                  }
                                }}
                                className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                title={language === 'fr' ? 'Supprimer' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-3">
                          {language === 'fr'
                            ? `${tasks.length} tâche(s) dans ce projet`
                            : `${tasks.length} task(s) in this project`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'access' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {language === 'fr' ? 'Accès & Rôles' : 'Access & Roles'}
                  </h3>
                  <div className="space-y-4">
                    {isManager && (
                      <div>
                        <button
                          onClick={() => {
                            onClose();
                            onInvite();
                          }}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          {language === 'fr' ? 'Inviter des entrepreneurs' : 'Invite Contractors'}
                        </button>
                      </div>
                    )}

                    {isAdmin && onAdminPanel && (
                      <div>
                        <button
                          onClick={() => {
                            onClose();
                            onAdminPanel();
                          }}
                          className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                          {language === 'fr' ? 'Panneau Admin' : 'Admin Panel'}
                        </button>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200">
                      <button
                        onClick={onSignOut}
                        className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors"
                      >
                        {language === 'fr' ? 'Se déconnecter' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {language === 'fr' ? 'Options d\'affichage' : 'Display Options'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Style de surbrillance (Gantt)' : 'Contractor Highlight (Gantt)'}
                      </label>
                      <p className="text-sm text-slate-600">
                        {language === 'fr'
                          ? 'Anneau bleu ciel subtil autour des tâches assignées'
                          : 'Subtle sky-blue ring around assigned tasks'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Densité mobile' : 'Mobile Density'}
                      </label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option>{language === 'fr' ? 'Confortable' : 'Comfortable'}</option>
                        <option>{language === 'fr' ? 'Compact' : 'Compact'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {language === 'fr' ? 'Notifications' : 'Notifications'}
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">
                          {language === 'fr' ? 'Rappels d\'échéance' : 'Due Date Reminders'}
                        </div>
                        <div className="text-sm text-slate-600">
                          {language === 'fr' ? 'Notification 48h avant l\'échéance' : 'Notify 48h before due date'}
                        </div>
                      </div>
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">
                          {language === 'fr' ? 'Mises à jour de tâches' : 'Task Updates'}
                        </div>
                        <div className="text-sm text-slate-600">
                          {language === 'fr' ? 'Alertes pour tâches modifiées ou bloquées' : 'Alerts for updated/blocked tasks'}
                        </div>
                      </div>
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {language === 'fr' ? 'Données & Export' : 'Data & Export'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Export CSV' : 'CSV Export'}
                      </label>
                      <p className="text-sm text-slate-600 mb-3">
                        {language === 'fr'
                          ? 'Exporter depuis la vue Gantt avec le bouton CSV'
                          : 'Export from Gantt view using CSV button'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Archiver le projet' : 'Archive Project'}
                      </label>
                      <button className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">
                        {language === 'fr' ? 'Archiver' : 'Archive'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {language === 'fr' ? 'Avancé' : 'Advanced'}
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">
                          {language === 'fr' ? 'Mises à jour en temps réel' : 'Realtime Updates'}
                        </div>
                        <div className="text-sm text-slate-600">
                          {language === 'fr' ? 'Synchronisation automatique' : 'Auto-sync changes'}
                        </div>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === 'fr' ? 'Limite de taille photo' : 'Photo Size Cap'}
                      </label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option>2 MB</option>
                        <option>5 MB</option>
                        <option>10 MB</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
