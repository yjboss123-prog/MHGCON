import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Language, useTranslation } from '../lib/i18n';
import { Project } from '../types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (name: string, description: string, customContractors: string[]) => void;
  language: Language;
}

export function ProjectSettingsModal({
  isOpen,
  onClose,
  project,
  onSave,
  language,
}: ProjectSettingsModalProps) {
  const t = useTranslation(language);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customContractors, setCustomContractors] = useState<string[]>([]);
  const [newContractor, setNewContractor] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setName(project.name);
      setDescription(project.description || '');
      setCustomContractors(project.custom_contractors || []);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleAddContractor = () => {
    const trimmed = newContractor.trim();
    if (trimmed && !customContractors.includes(trimmed)) {
      setCustomContractors([...customContractors, trimmed]);
      setNewContractor('');
    }
  };

  const handleRemoveContractor = (contractor: string) => {
    setCustomContractors(customContractors.filter(c => c !== contractor));
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      await onSave(name, description, customContractors);
      onClose();
    } catch (error) {
      console.error('Error saving project settings:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">{t.projectSettings}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.projectName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder={language === 'fr' ? 'Entrez le nom du projet' : 'Enter project name'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.projectDescription}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder={
                  language === 'fr'
                    ? 'Entrez la description du projet'
                    : 'Enter project description'
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'fr' ? 'Entrepreneurs personnalisés' : 'Custom Contractors'}
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newContractor}
                    onChange={(e) => setNewContractor(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddContractor()}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                    placeholder={language === 'fr' ? 'Ajouter un entrepreneur' : 'Add contractor'}
                  />
                  <button
                    type="button"
                    onClick={handleAddContractor}
                    className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {customContractors.length > 0 && (
                  <div className="space-y-1.5">
                    {customContractors.map((contractor) => (
                      <div
                        key={contractor}
                        className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <span className="text-sm text-slate-700">{contractor}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveContractor(contractor)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  {language === 'fr'
                    ? 'Ces entrepreneurs apparaîtront en plus des rôles par défaut'
                    : 'These contractors will appear in addition to default roles'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              disabled={isProcessing}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !name.trim()}
            >
              {isProcessing ? t.saving : t.saveChanges}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
