import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log("authguard user: ", user)
      if (!mounted) return;
      setUser(user);
      setLoading(false);
      if (!user) {
        router.replace('/auth');
      }
    });
    return () => { mounted = false; };
  }, []);

  if (loading) return null;
  return <>{user ? children : null}</>;
} 