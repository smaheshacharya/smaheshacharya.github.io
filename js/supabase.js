import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://afiupbpfbbrtneycutnc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VvysfOYVw8OuRdlYvPS5bg_GK6QmKqD';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ma-site-auth' }
});
