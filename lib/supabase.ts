
import { createClient } from '@supabase/supabase-js';

// Browser-safe configuration
const supabaseUrl = 'https://zbwyxvytvyomrzaahhen.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpid3l4dnl0dnlvbXJ6YWFoaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDIyOTIsImV4cCI6MjA4NDI3ODI5Mn0.7aJ7zzmNHJ0RYhVpDhylDwkKdLYf81LB1LGMoAk5Y_4';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
