import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Use environment variables for Supabase instance
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Validate environment variables (without logging sensitive data)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Add storage key for web to avoid conflicts
    storageKey: Platform.OS === 'web' ? 'kalyx-auth-token' : undefined,
    // Disable flow type to prevent auth loops
    flowType: 'implicit',
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
  // Monitor connection status with debouncing
  let authStateChangeTimeout: NodeJS.Timeout;
  
  supabase.auth.onAuthStateChange((event, session) => {
    // Clear previous timeout to debounce rapid auth state changes
    if (authStateChangeTimeout) {
      clearTimeout(authStateChangeTimeout);
    }
    
    // Debounce auth state changes to prevent loops
    authStateChangeTimeout = setTimeout(() => {
      console.log('🔐 Auth state change:', event, session ? 'Session exists' : 'No session');
    }, 100);
  });

  // Add error handling for network issues with retry logic
  const originalFetch = window.fetch;
  let retryCount = 0;
  const maxRetries = 3;
  
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Reset retry count on successful request
      if (response.ok) {
        retryCount = 0;
      }
      
      if (!response.ok && args[0]?.toString().includes('supabase')) {
        console.error('🌐 Supabase API error:', response.status, response.statusText);
        
        // Don't retry auth errors or client errors
        if (response.status >= 400 && response.status < 500) {
          return response;
        }
        
        // Retry server errors with exponential backoff
        if (response.status >= 500 && retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          console.log(`🔄 Retrying request (attempt ${retryCount}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return window.fetch(...args);
        }
      }
      
      return response;
    } catch (error) {
      if (args[0]?.toString().includes('supabase')) {
        console.error('🌐 Network error occurred');
        
        // Retry network errors
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          console.log(`🔄 Retrying request (attempt ${retryCount}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return window.fetch(...args);
        }
      }
      throw error;
    }
  };
}