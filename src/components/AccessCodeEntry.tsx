import { useState, useEffect } from 'react';
import { Lock, User, Shield, Briefcase, Key } from 'lucide-react';
import { saveSession } from '../lib/session';
import { getProject } from '../lib/api';

interface AccessCodeEntryProps {
  onSuccess: () => void;
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

export function AccessCodeEntry({ onSuccess }: AccessCodeEntryProps) {
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'contractor' | 'elevated'>('contractor');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [selectedContractorRole, setSelectedContractorRole] = useState('Construction Contractor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>(CONTRACTOR_ROLES);
  const [projectId, setProjectId] = useState('00000000-0000-0000-0000-000000000001');

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const project = await getProject();
        if (project) {
          setProjectId(project.id);
          if (project.custom_contractors) {
            setAvailableRoles([...CONTRACTOR_ROLES, ...project.custom_contractors]);
          }
        }
      } catch (err) {
        console.error('Error loading project:', err);
      }
    };
    loadRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError('Please enter your display name');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const role = userType === 'elevated' ? selectedRole : 'contractor';
      const contractorRole = userType === 'contractor' ? selectedContractorRole : null;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-register-or-login`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          displayName: displayName.trim(),
          role,
          contractorRole,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.success && data.session) {
        saveSession(data.session);
        onSuccess();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              MHG Tracker
            </h1>
            <p className="text-slate-600">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900"
                  placeholder="Your name"
                  autoFocus
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Minimum 4 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                User Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('contractor')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    userType === 'contractor'
                      ? 'border-slate-900 bg-slate-50 text-slate-900'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Briefcase className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Contractor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('elevated')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    userType === 'elevated'
                      ? 'border-slate-900 bg-slate-50 text-slate-900'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Shield className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Admin/PM</span>
                </button>
              </div>
            </div>

            {userType === 'elevated' ? (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                  Select Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all appearance-none bg-white text-slate-900"
                  >
                    {ELEVATED_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="contractorRole" className="block text-sm font-medium text-slate-700 mb-2">
                  Select Your Role
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    id="contractorRole"
                    value={selectedContractorRole}
                    onChange={(e) => setSelectedContractorRole(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all appearance-none bg-white text-slate-900"
                  >
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Select the role that matches your responsibilities
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue'}
              <Lock className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Secure password-based authentication
            </p>
            <p className="text-xs text-slate-400 text-center mt-2">
              First time? Enter a password to create your account.
              <br />
              Returning? Use your existing password to log in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
