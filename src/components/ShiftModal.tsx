import { useState } from 'react';
import { X } from 'lucide-react';
import { Task } from '../types';
import { Language } from '../lib/i18n';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onConfirm: (amount: number, unit: 'Days' | 'Weeks', skipDone: boolean) => void;
  language: Language;
}

export function ShiftModal({ isOpen, onClose, task, onConfirm, language }: ShiftModalProps) {
  const [amount, setAmount] = useState<number>(1);
  const [unit, setUnit] = useState<'Days' | 'Weeks'>('Days');
  const [skipDone, setSkipDone] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !task) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(amount, unit, skipDone);
      onClose();
    } catch (error) {
      console.error('Error shifting schedule:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const unitText = language === 'fr'
    ? (unit === 'Days' ? 'jours' : 'semaines')
    : (unit === 'Days' ? 'days' : 'weeks');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              {language === 'fr' ? 'Décaler le planning' : 'Delay / Shift Schedule'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{language === 'fr' ? 'Tâche' : 'Task'}:</span> {task.name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'fr' ? 'Montant' : 'Amount'}
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'fr' ? 'Unité' : 'Unit'}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={unit === 'Days'}
                    onChange={() => setUnit('Days')}
                    className="w-4 h-4 text-slate-700"
                  />
                  <span className="text-sm text-slate-700">
                    {language === 'fr' ? 'Jours' : 'Days'}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={unit === 'Weeks'}
                    onChange={() => setUnit('Weeks')}
                    className="w-4 h-4 text-slate-700"
                  />
                  <span className="text-sm text-slate-700">
                    {language === 'fr' ? 'Semaines' : 'Weeks'}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipDone}
                  onChange={(e) => setSkipDone(e.target.checked)}
                  className="w-4 h-4 text-slate-700 border-slate-300 rounded"
                />
                <span className="text-sm text-slate-700">
                  {language === 'fr'
                    ? 'Ignorer les tâches terminées'
                    : 'Skip completed tasks'}
                </span>
              </label>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-blue-900">
                {language === 'fr'
                  ? `Ceci déplacera toutes les tâches ultérieures de ${amount} ${unitText}.`
                  : `This will move all subsequent tasks forward by ${amount} ${unitText}.`}
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
              disabled={isProcessing}
            >
              {isProcessing
                ? (language === 'fr' ? 'Application...' : 'Applying...')
                : (language === 'fr' ? 'Confirmer' : 'Confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
