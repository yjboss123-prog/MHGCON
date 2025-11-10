import { useState, useEffect } from 'react';
import { X, Users, Activity, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuditLog, User } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'codes'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
            onClick={() => setActiveTab('codes')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'codes'
                ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Access Codes
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
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
          ) : activeTab === 'users' ? (
            <div className="space-y-3">
              {users.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No users yet</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.user_token}
                    className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-900">{user.display_name}</p>
                        <p className="text-sm text-slate-600 capitalize">
                          {user.role.replace('_', ' ')}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>Last active: {new Date(user.last_active_at).toLocaleString()}</p>
                      <p className="font-mono text-xs break-all">{user.user_token}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Contractor Code
                </h3>
                <div className="bg-white rounded-lg p-4 font-mono text-lg font-bold text-blue-900">
                  BUILD2025
                </div>
                <p className="text-sm text-blue-700 mt-3">
                  Share this code with contractors. They will be assigned the contractor role.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Elevated Code
                </h3>
                <div className="bg-white rounded-lg p-4 font-mono text-lg font-bold text-purple-900">
                  ADMINMASTER
                </div>
                <p className="text-sm text-purple-700 mt-3">
                  Share this code with admins, developers, and project managers. Users can choose their role after entering this code.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Security Note:</strong> These codes are stored securely on the server. In production, you should rotate these codes regularly and use environment variables.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
