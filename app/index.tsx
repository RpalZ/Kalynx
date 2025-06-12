import { Redirect } from 'expo-router';

export default function Index() {
  // console.log('Loading app/index.tsx');
  // console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  // console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  return <Redirect href="/(tabs)" />;
} 