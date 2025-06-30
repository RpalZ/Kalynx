import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Use environment variables for Supabase instance
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  });
}

console.log('🔧 Supabase client configuration:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Missing',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing',
  platform: Platform.OS
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Add storage key for web to avoid conflicts
    storageKey: Platform.OS === 'web' ? 'kalyx-auth-token' : undefined,
  },
  // Add global headers for better debugging
  global: {
    headers: {
      'X-Client-Info': `kalyx-app-${Platform.OS}`,
    },
  },
  // Add realtime configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Add connection monitoring for web
if (Platform.OS === 'web') {
  // Monitor connection status
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state change:', event, session ? 'Session exists' : 'No session');
  });

  // Add error handling for network issues
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      if (!response.ok && args[0]?.toString().includes('supabase')) {
        console.error('🌐 Supabase API error:', response.status, response.statusText);
      }
      return response;
    } catch (error) {
      if (args[0]?.toString().includes('supabase')) {
        console.error('🌐 Supabase network error:', error);
      }
      throw error;
    }
  };
}