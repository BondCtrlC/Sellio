import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase admin client with service role key
 * WARNING: This bypasses RLS - only use in trusted server-side code
 * Never expose this client to the browser
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
