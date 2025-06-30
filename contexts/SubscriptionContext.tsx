import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserSubscription, SubscriptionLimits, SUBSCRIPTION_LIMITS } from '@/types/subscription';

interface SubscriptionContextType {
  subscription: UserSubscription;
  limits: SubscriptionLimits;
  isLoading: boolean;
  checkLimit: (feature: keyof SubscriptionLimits) => boolean;
  getRemainingGenerations: () => Promise<number>;
  incrementUsage: (feature: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<UserSubscription>({
    isActive: false,
    tier: 'free',
  });
  const [isLoading, setIsLoading] = useState(true);

  const limits = SUBSCRIPTION_LIMITS[subscription.tier];

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (subData) {
        setSubscription({
          isActive: subData.is_active,
          tier: subData.subscription_type as 'free' | 'pro',
          expiresAt: subData.expires_at ? new Date(subData.expires_at) : undefined,
          provider: subData.provider,
          customerId: subData.provider_customer_id,
        });
      } else {
        // Default to free tier
        setSubscription({
          isActive: false,
          tier: 'free',
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkLimit = (feature: keyof SubscriptionLimits): boolean => {
    const limit = limits[feature];
    if (typeof limit === 'boolean') return limit;
    if (typeof limit === 'number') return limit === -1 || limit > 0;
    return false;
  };

  const getRemainingGenerations = async (): Promise<number> => {
    if (subscription.tier === 'pro') return -1; // unlimited

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const today = new Date().toISOString().split('T')[0];
      
      // Count today's recipe generations
      const { data: generations } = await supabase
        .from('recipes_generated')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      const used = generations?.length || 0;
      const remaining = Math.max(0, limits.dailyRecipeGenerations - used);
      
      return remaining;
    } catch (error) {
      console.error('Error getting remaining generations:', error);
      return 0;
    }
  };

  const incrementUsage = async (feature: string): Promise<void> => {
    // This would be called when a user uses a feature
    // For now, we'll just track recipe generations
    if (feature === 'recipe_generation') {
      // The usage is tracked when recipes are saved to the database
      // This function can be extended for other features
    }
  };

  const refreshSubscription = async (): Promise<void> => {
    setIsLoading(true);
    await fetchSubscription();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        limits,
        isLoading,
        checkLimit,
        getRemainingGenerations,
        incrementUsage,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};