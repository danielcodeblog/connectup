import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://ulincmalzilhdsbwghws.supabase.co';
const ANON_KEY = 'sb_publishable_tztYghqcdzgIko_QoMqbuw_6EAwx4Nf';

// Safely access process.env to prevent crashes in environments where 'process' is not defined
const getEnv = (key: string) => {
  try {
    return typeof process !== 'undefined' ? process.env[key] : undefined;
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL') || PROJECT_URL;
const supabaseKey = getEnv('SUPABASE_KEY') || ANON_KEY;

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

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL';