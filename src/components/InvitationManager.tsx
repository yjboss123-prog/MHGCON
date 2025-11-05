import { useState, useEffect } from 'react';
import { X, Mail, Copy, Check, AlertCircle, UserPlus } from 'lucide-react';
import { Invitation } from '../types';
import { getInvitations, createInvitation } from '../lib/api';
import { formatRelativeTime } from '../lib/utils';

interface InvitationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  allRoles: string[];
}

export function InvitationManager({ isOpen, onClose, allRoles }: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Construction Contractor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInvitations();
    }
  }, [isOpen]);

  const loadInvitations = async () => {
    try {
      const data = await getInvitations();
      setInvitations(data);
    } catch (err) {
      console.error('Error loading invitations:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await createInvitation(email.trim(), role);
      setEmail('');
      setRole('Construction Contractor');
      await loadInvitations();
    } catch (err: any) {
      if (err.code === '23505') {
        setError('This email already has a pending invitation');
      } else {
        setError('Failed to create invitation');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    const inviteUrl = `${window.location.origin}?code=${code}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  const pendingInvitations = invitations.filter(inv => !inv.accepted);
  const acceptedInvitations = invitations.filter(inv => inv.accepted);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Invite Contractors</h2>
                <p className="text-sm text-slate-600">Send invitations with assigned roles</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contractor@example.com"
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assign Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {allRoles.filter(r => r !== 'Project Manager').map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Pending Invitations</h3>
              {pendingInvitations.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No pending invitations</p>
              ) : (
                <div className="space-y-2">
                  {pendingInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
                            {inv.role}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatRelativeTime(inv.created_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(inv.invitation_code)}
                        className="ml-3 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                      >
                        {copiedCode === inv.invitation_code ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {acceptedInvitations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Accepted</h3>
                <div className="space-y-2">
                  {acceptedInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-200 text-emerald-800">
                            {inv.role}
                          </span>
                          <span className="text-xs text-slate-500">
                            Joined {formatRelativeTime(inv.created_at)}
                          </span>
                        </div>
                      </div>
                      <span className="ml-3 text-xs font-medium text-emerald-700">
                        <Check className="w-4 h-4" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
