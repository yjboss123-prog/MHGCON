import { useState } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';
import { createTask } from '../lib/api';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
  allRoles: string[];
}

export function AddTaskModal({ isOpen, onClose, onTaskAdded, allRoles }: AddTaskModalProps) {
  const [name, setName] = useState('');
  const [ownerRoles, setOwnerRoles] = useState<string[]>(['Project Manager']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Task name is required');
      return;
    }

    if (ownerRoles.length === 0) {
      setError('At least one person must be assigned');
      return;
    }

    if (!startDate || !endDate) {
      setError('Start and end dates are required');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    setIsSubmitting(true);

    try {
      await createTask({
        name: name.trim(),
        owner_roles: ownerRoles,
        start_date: startDate,
        end_date: endDate,
        percent_done: 0,
        status: 'On Track',
      });

      setName('');
      setOwnerRoles(['Project Manager']);
      setStartDate('');
      setEndDate('');
      onTaskAdded();
      onClose();
    } catch (err) {
      setError('Failed to create task');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Add New Task</h2>
            <button
              onClick={onClose}
              className="hidden sm:flex p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="sm:hidden fixed left-1/2 -translate-x-1/2 bottom-[calc(80px+env(safe-area-inset-bottom))] z-[3000] h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 pb-[calc(96px+env(safe-area-inset-bottom))] sm:pb-6">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Task Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter task name"
                className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assigned To <span className="text-red-600">*</span>
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-3">
                {allRoles.map((role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 active:bg-slate-100 p-3 rounded" style={{ minHeight: '44px' }}>
                    <input
                      type="checkbox"
                      checked={ownerRoles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setOwnerRoles([...ownerRoles, role]);
                        } else {
                          setOwnerRoles(ownerRoles.filter((r) => r !== role));
                        }
                      }}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-2 focus:ring-slate-400"
                    />
                    <span className="text-sm text-slate-700">{role}</span>
                    {ownerRoles.includes(role) && <Check className="w-4 h-4 text-slate-600 ml-auto" />}
                  </label>
                ))}
              </div>
              {ownerRoles.length > 0 && (
                <p className="mt-2 text-xs text-slate-600">
                  {ownerRoles.length} {ownerRoles.length === 1 ? 'person' : 'people'} assigned
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors"
                style={{ minHeight: '44px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 active:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                style={{ minHeight: '44px' }}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
