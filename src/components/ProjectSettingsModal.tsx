import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Language, useTranslation } from '../lib/i18n';

interface Project {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (name: string, description: string) => void;
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
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setName(project.name);
      setDescription(project.description || '');
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      await onSave(name, description);
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
