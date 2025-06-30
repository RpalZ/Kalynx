export interface SubscriptionTier {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
}

export interface UserSubscription {
  isActive: boolean;
  tier: 'free' | 'pro';
  expiresAt?: Date;
  provider?: string;
  customerId?: string;
}

export interface SubscriptionLimits {
  dailyRecipeGenerations: number;
  maxSavedRecipes: number;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customMealPlans: boolean;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '10 recipe generations per day',
      'Basic nutrition tracking',
      'Environmental impact tracking',
      'Basic leaderboard access',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: 'month',
    isPopular: true,
    features: [
      'Unlimited recipe generations',
      'Advanced nutrition analytics',
      'Custom meal planning',
      'Priority customer support',
      'Export data & reports',
      'Advanced environmental insights',
      'Premium leaderboard features',
    ],
  },
];

export const SUBSCRIPTION_LIMITS: Record<string, SubscriptionLimits> = {
  free: {
    dailyRecipeGenerations: 10,
    maxSavedRecipes: 20,
    advancedAnalytics: false,
    prioritySupport: false,
    customMealPlans: false,
  },
  pro: {
    dailyRecipeGenerations: -1, // unlimited
    maxSavedRecipes: -1, // unlimited
    advancedAnalytics: true,
    prioritySupport: true,
    customMealPlans: true,
  },
};