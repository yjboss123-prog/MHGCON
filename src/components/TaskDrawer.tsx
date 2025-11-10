import { useState, useEffect, memo, useCallback } from 'react';
import { Task, Comment, ProgressUpdate, TaskStatus, TASK_STATUSES, User } from '../types';
import { Session } from '../lib/session';
import { X, Upload, Send, AlertCircle, ArrowRight, Trash2, UserPlus } from 'lucide-react';
import {
  formatRelativeTime,
  formatDateTime,
  getStatusBadgeColor,
  getRoleBadgeColor,
  compressImage,
  isManagerRole,
} from '../lib/utils';
import { getComments, getProgressUpdates, createComment, createProgressUpdate, deleteComment, deleteProgressUpdate, getUsers, assignTaskToUser } from '../lib/api';

interface TaskDrawerProps {
  task: Task | null;
  currentRole: string;
  isOpen: boolean;
  mode: 'view' | 'update';
  onClose: () => void;
  onTaskUpdated: () => void;
  isAdmin?: boolean;
  session: Session | null;
}

export const TaskDrawer = memo(function TaskDrawer({
  task,
  currentRole,
  isOpen,
  mode,
  onClose,
  onTaskUpdated,
  isAdmin = false,
  session,
}: TaskDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [commentText, setCommentText] = useState('');
  const [percentDone, setPercentDone] = useState(0);
  const [status, setStatus] = useState<TaskStatus>('On Track');
  const [delayReason, setDelayReason] = useState('');
  const [note, setNote] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const loadTaskData = useCallback(async () => {
    if (!task) return;
    try {
      const [commentsData, updatesData, usersData] = await Promise.all([
        getComments(task.id),
        getProgressUpdates(task.id),
        getUsers(),
      ]);
      setComments(commentsData);
      setUpdates(updatesData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading task data:', err);
    }
  }, [task]);

  useEffect(() => {
    if (task && isOpen) {
      loadTaskData();
      setPercentDone(task.percent_done);
      setStatus(task.status);
      setDelayReason(task.delay_reason || '');
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5MB');
      return;
    }

    setPhotoFile(file);
    try {
      const compressed = await compressImage(file);
      setPhotoPreview(compressed);
      setError(null);
    } catch (err) {
      setError('Failed to process image');
    }
  };

  const handleSubmitUpdate = async () => {
    if (!task) return;

    const needsDelayReason = (status === 'Delayed' || status === 'Blocked') && percentDone < 100;
    if (needsDelayReason && !delayReason.trim()) {
      setError('Delay reason is required when status is Delayed or Blocked');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createProgressUpdate(
        task.id,
        currentRole,
        percentDone,
        status,
        needsDelayReason ? delayReason : undefined,
        note || undefined,
        photoPreview || undefined
      );

      setNote('');
      setDelayReason('');
      setPhotoFile(null);
      setPhotoPreview(null);
      await loadTaskData();
      onTaskUpdated();
    } catch (err) {
      setError('Failed to save update');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!task || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await createComment(task.id, currentRole, commentText);
      setCommentText('');
      await loadTaskData();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await deleteComment(commentId);
      await loadTaskData();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Failed to delete comment');
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!confirm('Delete this update?')) return;

    try {
      await deleteProgressUpdate(updateId);
      await loadTaskData();
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to delete update:', err);
      setError('Failed to delete update');
    }
  };

  if (!task) return null;

  const canUpdate = task.owner_roles.includes(currentRole) || isManagerRole(currentRole);
  const needsDelayReason = (status === 'Delayed' || status === 'Blocked') && percentDone < 100;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200 backdrop-blur-sm"
        onClick={onClose}
        style={{ isolation: 'isolate' }}
      />
      <div
        className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-xl z-50 overflow-y-auto smooth-scroll"
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform',
          contain: 'layout style paint'
        }}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10" style={{ contain: 'layout' }}>
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === 'update' ? 'Update Task' : 'Task Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {task.was_shifted && (
            <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
              <div className="bg-white text-blue-600 rounded-full p-2">
                <ArrowRight className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm uppercase tracking-wide">Schedule Shifted</div>
                {task.last_shift_date && (
                  <div className="text-xs text-blue-100 mt-0.5">
                    Last shifted: {new Date(task.last_shift_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{task.name}</h3>
            <div className="flex flex-wrap gap-2">
              {task.owner_roles.map((role) => (
                <span key={role} className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(role)}`}>
                  {role}
                </span>
              ))}
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                {task.status} - {task.percent_done}%
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {new Date(task.start_date).toLocaleDateString()} -{' '}
              {new Date(task.end_date).toLocaleDateString()}
            </div>
          </div>

          {(session?.role === 'admin' || session?.role === 'project_manager') && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Assign to User
              </h4>
              {task.assigned_display_name && (
                <div className="mb-3 text-sm text-slate-700">
                  Currently assigned to: <span className="font-semibold">{task.assigned_display_name}</span>
                </div>
              )}
              <div className="flex gap-2">
                <select
                  onChange={async (e) => {
                    const value = e.target.value;
                    if (value) {
                      setIsAssigning(true);
                      try {
                        const selectedUser = users.find(u => u.user_token === value);
                        await assignTaskToUser(task.id, value, selectedUser?.display_name || null);
                        onTaskUpdated();
                      } catch (err) {
                        console.error('Error assigning task:', err);
                      } finally {
                        setIsAssigning(false);
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                  disabled={isAssigning}
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.user_token} value={user.user_token}>
                      {user.display_name} ({user.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                {task.assigned_user_token && (
                  <button
                    onClick={async () => {
                      setIsAssigning(true);
                      try {
                        await assignTaskToUser(task.id, null, null);
                        onTaskUpdated();
                      } catch (err) {
                        console.error('Error unassigning task:', err);
                      } finally {
                        setIsAssigning(false);
                      }
                    }}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
                    disabled={isAssigning}
                  >
                    Unassign
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === 'update' && canUpdate && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-slate-900">Record Progress Update</h4>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Completion: {percentDone}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={percentDone}
                  onChange={(e) => setPercentDone(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {needsDelayReason && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason for Delay <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="Explain why the task is delayed..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Photo (optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-700">
                      {photoFile ? photoFile.name : 'Choose file'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {photoPreview && (
                  <div className="mt-3">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmitUpdate}
                disabled={isSubmitting || (needsDelayReason && !delayReason.trim())}
                className="w-full px-4 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save Update'}
              </button>
            </div>
          )}

          <div>
            <h4 className="font-medium text-slate-900 mb-3">Activity</h4>
            <div className="space-y-4">
              {updates.map((update) => (
                <div key={update.id} className="border-l-2 border-slate-200 pl-4 py-2">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(update.author_role)}`}>
                      {update.author_role}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs text-slate-500 cursor-help"
                        title={formatDateTime(update.created_at)}
                      >
                        {formatRelativeTime(update.created_at)}
                      </span>
                      {(isAdmin || update.author_role === currentRole) && (
                        <button
                          onClick={() => handleDeleteUpdate(update.id)}
                          className="p-2 hover:bg-red-50 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Delete update"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-slate-900">
                    Updated to <span className="font-semibold">{update.percent_done}%</span> -{' '}
                    <span className="font-semibold">{update.status}</span>
                  </div>
                  {update.delay_reason && (
                    <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      <span className="font-medium">Delay:</span> {update.delay_reason}
                    </div>
                  )}
                  {update.note && (
                    <p className="mt-1 text-sm text-slate-600">{update.note}</p>
                  )}
                  {update.photo_base64 && (
                    <img
                      src={update.photo_base64}
                      alt="Update"
                      className="mt-2 w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>
              ))}

              {comments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-slate-200 pl-4 py-2">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(comment.author_role)}`}>
                      {comment.author_role}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs text-slate-500 cursor-help"
                        title={formatDateTime(comment.created_at)}
                      >
                        {formatRelativeTime(comment.created_at)}
                      </span>
                      {(isAdmin || comment.author_role === currentRole) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-2 hover:bg-red-50 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Delete comment"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{comment.message}</p>
                </div>
              ))}

              {updates.length === 0 && comments.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No activity yet</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-3">Add Comment</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isSubmitting}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
