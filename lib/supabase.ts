
import { createClient } from '@supabase/supabase-js';

// Access variables defined via vite.config.ts
const rawUrl = process.env.SUPABASE_URL;
const rawKey = process.env.SUPABASE_ANON_KEY;

// Check for valid configuration (not undefined, not empty, and not a placeholder string)
export const isSupabaseConfigured = !!(
  rawUrl && 
  rawUrl.length > 10 && 
  rawKey && 
  rawKey.length > 10
);

// Fallback to valid URL format to prevent createClient from throwing an error
const supabaseUrl = isSupabaseConfigured ? rawUrl! : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey! : 'placeholder-key';

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase credentials missing or invalid. Authentication and Database features are disabled. " +
    "Please check your Vercel Environment Variables for SUPABASE_URL and SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
