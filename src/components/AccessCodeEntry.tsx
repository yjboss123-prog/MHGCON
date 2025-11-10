import { useState } from 'react';
import { Lock, User, Shield } from 'lucide-react';
import { verifyCode, saveSession } from '../lib/session';

interface AccessCodeEntryProps {
  onSuccess: () => void;
}

const ELEVATED_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'developer', label: 'Developer' },
  { value: 'project_manager', label: 'Project Manager' },
];

export function AccessCodeEntry({ onSuccess }: AccessCodeEntryProps) {
  const [step, setStep] = useState<'code' | 'details'>('code');
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [isElevated, setIsElevated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter an access code');
      return;
    }

    const isElevatedCode = code.toUpperCase() === 'ADMINMASTER';
    setIsElevated(isElevatedCode);
    setStep('details');
    setError('');
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError('Please enter your display name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const session = await verifyCode(
        code,
        displayName.trim(),
        isElevated ? selectedRole : undefined
      );

      saveSession(session);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid access code');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('code');
    setError('');
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
              {step === 'code' ? 'Enter your access code to continue' : 'Complete your profile'}
            </p>
          </div>

          {step === 'code' ? (
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-2">
                  Access Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  placeholder="Enter your code"
                  autoFocus
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <Lock className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleDetailsSubmit} className="space-y-6">
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
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    placeholder="Your name"
                    autoFocus
                    autoComplete="name"
                  />
                </div>
              </div>

              {isElevated && (
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
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      {ELEVATED_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Secure code-based authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
