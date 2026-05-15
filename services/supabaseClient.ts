import { createClient } from '@supabase/supabase-js';

// Standard Vite environment variable access
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. App will run in Mock Mode.');
}

// Ensure createClient is called with a dummy url if keys are missing to prevent crash
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder', {
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

// Diagnostic check
export const checkConnection = async () => {
    try {
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        if (error) {
            console.error('Supabase connection test failed:', error);
            return false;
        }
        console.log('Supabase connection test successful');
        return true;
    } catch (e) {
        console.error('Supabase connection test exception:', e);
        return false;
    }
};

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey && !supabaseKey.startsWith('sb_publishable_');
