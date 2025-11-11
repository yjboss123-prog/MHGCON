import { supabase } from './supabase';

export interface Session {
  session_token: string;
  user_token: string;
  display_name: string;
  role: 'contractor' | 'admin' | 'developer' | 'project_manager';
  contractor_role?: string | null;
  expires_at: string;
}

const SESSION_KEY = 'mhg_session';

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored) as Session;
    if (new Date(session.expires_at) < new Date()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function verifyCode(
  code: string,
  displayName: string,
  role?: string
): Promise<Session> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-verify-code`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, displayName, role }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify code');
  }

  return data.session;
}

export async function validateSession(sessionToken: string): Promise<Session | null> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-validate-session`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_token: sessionToken }),
  });

  const data = await response.json();

  if (!response.ok || !data.valid) {
    return null;
  }

  return {
    session_token: sessionToken,
    ...data.session,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export async function signOut(): Promise<void> {
  const session = getSession();
  if (!session) return;

  await supabase
    .from('sessions')
    .delete()
    .eq('session_token', session.session_token);

  clearSession();
}

export function isAdmin(session: Session | null): boolean {
  return session?.role === 'admin';
}

export function isElevated(session: Session | null): boolean {
  return session?.role === 'admin' || session?.role === 'developer' || session?.role === 'project_manager';
}

export function canManageTasks(session: Session | null): boolean {
  return session?.role === 'admin' || session?.role === 'project_manager';
}

export function canDeleteTasks(session: Session | null): boolean {
  return session?.role === 'admin';
}
