import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { Task, TaskStatus, TASK_STATUSES } from '../types';
import { Session } from '../lib/session';
import { X, Upload, Camera, Check, AlertCircle } from 'lucide-react';
import { formatDateTime, compressImage } from '../lib/utils';
import { updateTask, createTaskAttachment, getTaskAttachments } from '../lib/api';

interface TaskDrawerProps {
  task: Task | null;
  currentRole: string;
  isOpen: boolean;
  mode: 'view' | 'update';
  onClose: () => void;
  onTaskUpdated: () => void;
  isAdmin?: boolean;
  session: Session | null;
  allRoles: string[];
}

interface Attachment {
  id: number;
  file_url: string;
  caption: string | null;
  created_at: string;
}

export const TaskDrawer = memo(function TaskDrawer({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  session,
}: TaskDrawerProps) {
  const [percentDone, setPercentDone] = useState(0);
  const [status, setStatus] = useState<TaskStatus>('On Track');
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTaskData = useCallback(async () => {
    if (!task) return;
    try {
      const attachmentsData = await getTaskAttachments(task.id);
      setAttachments(attachmentsData);
    } catch (err) {
      console.error('Error loading attachments:', err);
    }
  }, [task]);

  useEffect(() => {
    if (task && isOpen) {
      loadTaskData();
      setPercentDone(task.percent_done);
      setStatus(task.status);
      setComment('');
      setError(null);
      setShowSuccess(false);
    }
  }, [task, isOpen, loadTaskData]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const validateForm = (): string | null => {
    if (status === 'Delayed' || status === 'Blocked') {
      if (!comment.trim() && !task?.delay_reason) {
        return 'Please add a reason when marking a task as Delayed or Blocked.';
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!task) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const updates: Partial<Task> = {
        percent_done: percentDone,
        status,
      };

      if (comment.trim()) {
        updates.delay_reason = comment;
      }

      if (status === 'Done') {
        updates.percent_done = 100;
        setPercentDone(100);
      }

      await updateTask(task.id, updates);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onTaskUpdated();
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkDone = async () => {
    if (!task) return;

    setPercentDone(100);
    setStatus('Done');

    setIsSaving(true);
    try {
      await updateTask(task.id, {
        percent_done: 100,
        status: 'Done',
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onTaskUpdated();
    } catch (err) {
      console.error('Error marking done:', err);
      setError('Failed to mark as done. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkBlocked = async () => {
    if (!task) return;

    if (!comment.trim() && !task.delay_reason) {
      setError('Please add a reason for blocking this task.');
      return;
    }

    setStatus('Blocked');
    setIsSaving(true);
    try {
      const updates: Partial<Task> = {
        status: 'Blocked',
      };
      if (comment.trim()) {
        updates.delay_reason = comment;
      }

      await updateTask(task.id, updates);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onTaskUpdated();
    } catch (err) {
      console.error('Error marking blocked:', err);
      setError('Failed to mark as blocked. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be less than 10MB');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const compressed = await compressImage(file, 1200);

      await createTaskAttachment(
        task.id,
        task.project_id || '',
        compressed,
        undefined,
        session?.user_token
      );

      await loadTaskData();

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setPercentDone(value);
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Done') {
      setPercentDone(100);
    }
    setError(null);
  };

  if (!isOpen || !task) return null;

  const isPastDue = task.end_date && new Date(task.end_date) < new Date() && percentDone < 100;
  const needsComment = (status === 'Delayed' || status === 'Blocked');

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-xl z-50 overflow-y-auto smooth-scroll min-h-dvh"
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 z-10 pt-safe">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900 truncate">
                {task.name}
              </h2>
              {task.assigned_display_name && (
                <div className="text-xs text-slate-500 mt-0.5">
                  Assigned to {task.assigned_display_name}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="hidden sm:flex p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              style={{ minHeight: '44px', minWidth: '44px' }}
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6 pb-32 sm:pb-32" style={{ paddingBottom: 'calc(180px + env(safe-area-inset-bottom))' }}>
          {task.was_shifted && (
            <div className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-sm">
                This task was recently shifted. Please review the timeline.
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {showSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 flex-shrink-0" />
              <div className="text-sm font-medium">Saved successfully!</div>
            </div>
          )}

          {isPastDue && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                Past due — consider setting status to Delayed if still in progress.
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-900">
                  Progress: {percentDone}%
                </label>
                <span className="text-xs text-slate-500">
                  {percentDone === 100 ? 'Complete' : `${100 - percentDone}% remaining`}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={percentDone}
                onChange={handleSliderChange}
                disabled={status === 'Done'}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-200"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentDone}%, #e2e8f0 ${percentDone}%, #e2e8f0 100%)`,
                  WebkitAppearance: 'none',
                }}
              />

              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${percentDone}%` }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-3">
                Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TASK_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                      status === s
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    style={{ minHeight: '48px' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-2">
                Comment {needsComment && <span className="text-red-600">*</span>}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={needsComment ? "Required when task is Delayed or Blocked" : "Add a note or update (optional)"}
                className={`w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 ${
                  needsComment && !comment.trim() && !task.delay_reason
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
                rows={4}
                style={{ fontSize: '16px' }}
              />
              {task.delay_reason && (
                <div className="mt-2 text-xs text-slate-600">
                  Previous reason: {task.delay_reason}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-3">
                Photos & Files
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full py-4 px-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-3 text-slate-600 hover:text-blue-600"
                style={{ minHeight: '56px' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span className="font-medium">Add Photo or File</span>
                    <Upload className="w-4 h-4" />
                  </>
                )}
              </button>

              {attachments.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {attachments.map((att) => (
                    <div key={att.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={att.file_url}
                        alt={att.caption || 'Attachment'}
                        className="w-full h-full object-cover"
                      />
                      {att.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                          {att.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500 space-y-1">
                <div>Start: {new Date(task.start_date).toLocaleDateString()}</div>
                <div>End: {new Date(task.end_date).toLocaleDateString()}</div>
                {task.updated_at && <div>Last updated: {formatDateTime(task.updated_at)}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 z-20" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <div className="px-4 py-3 flex gap-2">
            <button
              onClick={handleMarkBlocked}
              disabled={isSaving || isSubmitting}
              className="flex-1 py-3 px-4 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 active:bg-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '48px' }}
            >
              Blocked
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isSubmitting}
              className="flex-1 py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
              style={{ minHeight: '48px' }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleMarkDone}
              disabled={isSaving || isSubmitting}
              className="flex-1 py-3 px-4 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 active:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
              style={{ minHeight: '48px' }}
            >
              Mark Done
            </button>
          </div>

          <div className="sm:hidden px-4 pb-3">
            <button
              onClick={onClose}
              className="w-full h-12 rounded-xl font-medium bg-slate-900 text-white shadow-sm active:scale-[.99] transition-all"
              style={{ minHeight: '48px' }}
              aria-label="Close task"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
});
