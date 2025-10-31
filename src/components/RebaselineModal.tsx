import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Language } from '../lib/i18n';

interface RebaselineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newBaselineStart: string, resetStatuses: boolean, clearDelayReasons: boolean) => void;
  language: Language;
}

export function RebaselineModal({ isOpen, onClose, onConfirm, language }: RebaselineModalProps) {
  const [newBaselineStart, setNewBaselineStart] = useState<string>('');
  const [resetStatuses, setResetStatuses] = useState<boolean>(true);
  const [clearDelayReasons, setClearDelayReasons] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const nextMonday = getNextMonday();
      setNewBaselineStart(nextMonday);
    }
  }, [isOpen]);

  const getNextMonday = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().slice(0, 10);
  };

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(newBaselineStart, resetStatuses, clearDelayReasons);
      onClose();
    } catch (error) {
      console.error('Error rebaselining:', error);
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
            <h2 className="text-xl font-semibold text-slate-900">
              {language === 'fr' ? 'Recalibrer le projet' : 'Rebaseline Project'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-blue-900">
                {language === 'fr'
                  ? 'Cette action déplacera toutes les tâches du projet vers une nouvelle date de début.'
                  : 'This will shift all project tasks to a new baseline start date.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'fr' ? 'Nouvelle date de début' : 'New Baseline Start Date'}
              </label>
              <input
                type="date"
                value={newBaselineStart}
                onChange={(e) => setNewBaselineStart(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetStatuses}
                  onChange={(e) => setResetStatuses(e.target.checked)}
                  className="w-4 h-4 text-slate-700 border-slate-300 rounded"
                />
                <span className="text-sm text-slate-700">
                  {language === 'fr'
                    ? 'Réinitialiser les statuts (non-Terminé → En cours)'
                    : 'Reset statuses (non-Done → On Track)'}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearDelayReasons}
                  onChange={(e) => setClearDelayReasons(e.target.checked)}
                  className="w-4 h-4 text-slate-700 border-slate-300 rounded"
                />
                <span className="text-sm text-slate-700">
                  {language === 'fr'
                    ? 'Effacer les raisons de retard pour les tâches réinitialisées'
                    : 'Clear delay reasons for reset tasks'}
                </span>
              </label>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-sm text-amber-900">
                {language === 'fr'
                  ? '⚠️ Cette action affectera toutes les tâches du projet.'
                  : '⚠️ This action will affect all tasks in the project.'}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              disabled={isProcessing}
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !newBaselineStart}
            >
              {isProcessing
                ? (language === 'fr' ? 'Traitement...' : 'Processing...')
                : (language === 'fr' ? 'Confirmer' : 'Confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
