import { createClient, SupabaseClient } from '@supabase/supabase-js';

const nodeProcess = typeof process !== 'undefined' ? process : undefined;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || nodeProcess?.env?.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || nodeProcess?.env?.VITE_SUPABASE_ANON_KEY;

const missingVariables = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
].filter((value): value is string => value !== null);

let supabaseClient: SupabaseClient | null = null;
let configurationError: Error | null = null;

if (missingVariables.length > 0) {
  const message =
    `Supabase configuration error. Missing environment variable${
      missingVariables.length > 1 ? 's' : ''
    }: ${missingVariables.join(
      ', '
    )}. Ensure they are defined in Vercel (with the VITE_ prefix) and redeploy.`;

  configurationError = new Error(message);
  console.error(message, {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    suppliedVariables: {
      VITE_SUPABASE_URL: supabaseUrl ? 'Set' : 'Missing',
      VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Missing',
    },
  });
} else {
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
}

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  throw configurationError ?? new Error('Supabase client is not configured.');
}

export function isSupabaseConfigured(): boolean {
  return supabaseClient !== null;
}

export function getSupabaseConfigurationError(): Error | null {
  return configurationError;
}
