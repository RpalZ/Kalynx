import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      console.log('🔍 Index: Checking authentication...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Index: Auth error:', error);
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
    } catch (error) {
      console.error('💥 Index: Unexpected error:', error);
      router.replace('/auth');
    }
  };

  // Show loading while checking auth
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}