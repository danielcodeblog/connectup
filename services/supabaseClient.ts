import { createClient } from '@supabase/supabase-js';

// Standard Vite environment variable access
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ulincmalzilhdsbwghws.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. App will run in Mock Mode.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Global listener to handle session errors
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  }
  if (event === 'SIGNED_OUT') {
    // Clear any local storage that might be stale
    console.log('User signed out, clearing local storage');
  }
});

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey && !supabaseKey.startsWith('sb_publishable_');
