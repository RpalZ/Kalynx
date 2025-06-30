import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const { theme } = useTheme();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    // Prevent infinite loops
    if (retryCount > 3) {
      console.log('❌ Max retry attempts reached, redirecting to auth');
      router.replace('/auth');
      return;
    }

    try {
      console.log('🔍 Index: Starting auth check attempt', retryCount + 1);
      setError(null);
      
      // Add shorter timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth check timeout after 5 seconds')), 5000);
      });

      const authPromise = supabase.auth.getUser();
      
      const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      console.log('👤 Auth check result:', { 
        user: user ? `${user.id} (${user.email})` : 'None', 
        error: error?.message || 'None',
        attempt: retryCount + 1
      });
      
      if (error) {
        console.error('❌ Index: Auth error:', error);
        // Don't retry on auth errors, just go to auth page
        router.replace('/auth');
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
      console.error('💥 Index: Auth check error:', error);
      setError(`Connection issue: ${error.message}`);
      
      // Retry with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        checkAuthAndRedirect();
      }, retryDelay);
    } finally {
      setIsChecking(false);
    }
  };

  // Show error state if there's an issue
  if (error && retryCount > 3) {
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
          {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Checking authentication'}
        </Text>
        {error && retryCount <= 3 && (
          <Text style={[styles.retryText, { color: theme.colors.warning }]}>
            Connection issue, retrying...
          </Text>
        )}
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
  retryText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
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