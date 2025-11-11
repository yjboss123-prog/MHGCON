import { useState, useEffect } from 'react';
import { X, Users, Activity, Key, Plus, Trash2, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuditLog, User } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ELEVATED_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'developer', label: 'Developer' },
  { value: 'project_manager', label: 'Project Manager' },
];

const CONTRACTOR_ROLES = [
  'Construction Contractor',
  'Architect',
  'Chief of Plumbing',
  'Chief of Electronics',
];

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'codes'>('users');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    displayName: '',
    password: '',
    role: 'Construction Contractor',
  });
  const [addingUser, setAddingUser] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'audit') {
        const { data } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        setAuditLogs(data || []);
      } else if (activeTab === 'users') {
        const { data } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newUser.displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    if (!newUser.password || newUser.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setAddingUser(true);

    try {
      const elevatedRoleValues = ELEVATED_ROLES.map(r => r.value);
      const isElevated = elevatedRoleValues.includes(newUser.role);

      const role = isElevated ? newUser.role : 'contractor';
      const contractorRole = isElevated ? null : newUser.role;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-register-or-login`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: '00000000-0000-0000-0000-000000000001',
          displayName: newUser.displayName.trim(),
          role,
          contractorRole,
          password: newUser.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setNewUser({ displayName: '', password: '', role: 'Construction Contractor' });
      setShowAddUser(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userToken: string, displayName: string) => {
    if (!confirm(`Are you sure you want to delete user "${displayName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_token', userToken);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-2xl z-[61] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6" />
            Admin Panel
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'audit'
                ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'codes'
                ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Info
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Manage Users</h3>
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>

              {showAddUser && (
                <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-900 mb-4">
                  <h4 className="font-medium text-slate-900 mb-4">Create New User</h4>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={newUser.displayName}
                        onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        placeholder="John Doe"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        placeholder="Min 4 characters"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Role
                      </label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent appearance-none bg-white"
                      >
                        <optgroup label="Contractors">
                          {CONTRACTOR_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Management">
                          {ELEVATED_ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddUser(false);
                          setError('');
                          setNewUser({ displayName: '', password: '', role: 'Construction Contractor' });
                        }}
                        className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                        disabled={addingUser}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                        disabled={addingUser}
                      >
                        {addingUser ? 'Creating...' : 'Create User'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                {users.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No users yet</p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.user_token}
                      className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3">
                          <div className="bg-slate-200 rounded-full p-2">
                            <UserIcon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.display_name}</p>
                            <p className="text-sm text-slate-600">
                              {user.contractor_role || user.role.replace('_', ' ')}
                            </p>
                            {user.last_seen && (
                              <p className="text-xs text-slate-500 mt-1">
                                Last seen: {new Date(user.last_seen).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteUser(user.user_token, user.display_name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-2 break-all">
                        {user.user_token}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'audit' ? (
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No audit logs yet</p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-slate-900">{log.action}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {log.ip_address && (
                      <p className="text-xs text-slate-600 mb-1">IP: {log.ip_address}</p>
                    )}
                    {Object.keys(log.details).length > 0 && (
                      <div className="text-xs text-slate-600 bg-white rounded p-2 mt-2">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Password-Based Authentication
                </h3>
                <p className="text-sm text-slate-700 mb-4">
                  Users can register and log in with:
                </p>
                <ul className="text-sm text-slate-600 space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>Display Name</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>Password (min 4 characters)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>Their role (contractor or management)</span>
                  </li>
                </ul>
                <div className="bg-white rounded-lg p-4 mt-4 border border-slate-200">
                  <p className="text-sm text-slate-700">
                    <strong>How it works:</strong> First-time users create an account automatically.
                    Returning users log in with the same credentials. No duplicate accounts allowed.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Admin Note:</strong> You can pre-create user accounts in the Users tab
                  with specific passwords, then share those credentials with your team members.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
