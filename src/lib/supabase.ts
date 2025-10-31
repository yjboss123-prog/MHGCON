import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let missingEnvMessage: string | null = null;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  missingEnvMessage =
    'Supabase credentials are missing. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
  if (typeof console !== 'undefined') {
    console.warn(missingEnvMessage);
  }
}

export function isSupabaseConfigured(): boolean {
  return client !== null;
}

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    throw new Error(missingEnvMessage ?? 'Supabase client has not been initialised.');
  }
  return client;
}
