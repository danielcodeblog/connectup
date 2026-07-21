import { createClient } from '@supabase/supabase-js';

// Standard Vite environment variable access with process level fallback
const getEnvVar = (metaKey: string, processName: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[metaKey]) {
    return import.meta.env[metaKey];
  }
  // Try to read compiled/injected process.env
  try {
    const val = (process as any).env[processName];
    if (val) return val;
  } catch (e) {}
  
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'VITE_SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL', 'SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL') || 'https://placeholder-project.supabase.co';
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY', 'SUPABASE_KEY') || 'placeholder-key';

if (supabaseUrl.includes('placeholder') || !supabaseKey || supabaseKey === 'placeholder-key') {
  console.warn('Supabase credentials missing or invalid. App will run in Mock Mode.');
}

// Ensure createClient is called with a dummy url if keys are missing to prevent crash
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
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

export const isSupabaseConfigured = !!supabaseUrl && 
                                   !supabaseUrl.includes('placeholder') && 
                                   !!supabaseKey && 
                                   supabaseKey !== 'placeholder-key' && 
                                   !supabaseKey.startsWith('sb_publishable_');
