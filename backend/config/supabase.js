import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Mungojnë variablat e mjedisit për Supabase');
}

// Krijon klientin Supabase me service role key (kalon RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
