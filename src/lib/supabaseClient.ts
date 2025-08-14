import { createClient } from '@supabase/supabase-js';

// Fallback values for development when env vars are not set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || 'placeholder_anon_key';

export const supabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  { auth: { persistSession: true } }
);
