import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to default values for production
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Only throw error if both are missing and we're not in production
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase environment variables not set, using default values');
  console.warn('⚠️ Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in production');
}

// Krijon klientin Supabase me service role key (kalon RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
