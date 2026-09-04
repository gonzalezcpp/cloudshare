import { createClient } from '@supabase/supabase-js';

let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
    }

    _supabase = createClient(url, key);
  }
  return _supabase;
}

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error('Supabase not configured.');
    }

    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

const BUCKET = process.env.SUPABASE_BUCKET || 'cloudshare-files';

export function getSupabasePublicUrl(path: string): string {
  const url = process.env.SUPABASE_URL;
  return `${url}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function uploadToSupabase(
  path: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
}

export async function deleteFromSupabase(path: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
}
