import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const { theme } = useTheme();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      console.log('🔍 Index: Starting auth check...');
      console.log('🌐 Environment check:', {
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        platform: Platform.OS,
        userAgent: Platform.OS === 'web' ? navigator.userAgent : 'N/A'
      });

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth check timeout')), 10000);
      });

      const authPromise = supabase.auth.getUser();
      
      const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      console.log('👤 Auth check result:', { 
        user: user ? `${user.id} (${user.email})` : 'None', 
        error: error?.message || 'None' 
      });
      
      if (error) {
        console.error('❌ Index: Auth error:', error);
        setError(`Auth error: ${error.message}`);
        // Still redirect to auth page even with error
        setTimeout(() => router.replace('/auth'), 2000);
        return;
      }
      
      if (user) {
        console.log('✅ Index: User authenticated, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('❌ Index: No user, redirecting to auth');
        router.replace('/auth');
      }
    } catch (error: any) {
      console.error('💥 Index: Unexpected error:', error);
      setError(`Unexpected error: ${error.message}`);
      // Fallback to auth page after showing error
      setTimeout(() => router.replace('/auth'), 3000);
    } finally {
      setIsChecking(false);
    }
  };

  // Show error state if there's an issue
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
            Connection Issue
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.colors.placeholder }]}>
            Redirecting to login...
          </Text>
        </View>
      </View>
    );
  }

  // Show loading while checking auth
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.card }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading Kalyx...
        </Text>
        <Text style={[styles.loadingSubtext, { color: theme.colors.textSecondary }]}>
          Checking authentication
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  errorSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
});