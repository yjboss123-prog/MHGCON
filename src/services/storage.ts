import { getSupabaseClient } from '../lib/supabase';

export async function uploadUpdatePhoto(file: File) {
  const supabase = getSupabaseClient();
  const fileName = `${crypto.randomUUID()}_${file.name}`;
  const path = `updates/${fileName}`;
  const { error } = await supabase.storage.from('task-photos').upload(path, file, {
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function getPublicUrl(path: string) {
  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from('task-photos').getPublicUrl(path);
  return data.publicUrl;
}
