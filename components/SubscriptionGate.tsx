import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles, Zap } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionModal } from './SubscriptionModal';

const { width } = Dimensions.get('window');

interface SubscriptionGateProps {
  feature: 'recipe_generation' | 'advanced_analytics' | 'custom_meal_plans';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  feature,
  children,
  fallback,
}) => {
  const { theme } = useTheme();
  const { subscription, limits, getRemainingGenerations } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState(0);

  useEffect(() => {
    if (feature === 'recipe_generation') {
      checkRemainingGenerations();
    }
  }, [feature]);

  const checkRemainingGenerations = async () => {
    const remaining = await getRemainingGenerations();
    setRemainingGenerations(remaining);
  };

  const hasAccess = () => {
    if (subscription.tier === 'pro') return true;
    
    switch (feature) {
      case 'recipe_generation':
        return remainingGenerations > 0;
      case 'advanced_analytics':
        return limits.advancedAnalytics;
      case 'custom_meal_plans':
        return limits.customMealPlans;
      default:
        return false;
    }
  };

  const getFeatureName = () => {
    switch (feature) {
      case 'recipe_generation':
        return 'Recipe Generation';
      case 'advanced_analytics':
        return 'Advanced Analytics';
      case 'custom_meal_plans':
        return 'Custom Meal Plans';
      default:
        return 'Premium Feature';
    }
  };

  const getFeatureDescription = () => {
    switch (feature) {
      case 'recipe_generation':
        return `You've reached your daily limit of ${limits.dailyRecipeGenerations} recipe generations. Upgrade to Pro for unlimited access!`;
      case 'advanced_analytics':
        return 'Get detailed insights into your nutrition and environmental impact with Pro analytics.';
      case 'custom_meal_plans':
        return 'Create personalized meal plans tailored to your goals with Pro features.';
      default:
        return 'This feature is available with a Pro subscription.';
    }
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <View style={[styles.gateContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <LinearGradient
          colors={[theme.colors.gradient.warning[0], theme.colors.gradient.warning[1]]}
          style={styles.gateGradient}
        >
          <View style={styles.gateIcon}>
            <Crown size={32} color="#FFFFFF" />
            <Sparkles size={16} color="#FFFFFF" style={styles.sparkle} />
          </View>
          
          <Text style={styles.gateTitle}>Upgrade to Pro</Text>
          <Text style={styles.gateSubtitle}>{getFeatureName()}</Text>
          <Text style={styles.gateDescription}>{getFeatureDescription()}</Text>
          
          {feature === 'recipe_generation' && (
            <View style={styles.usageInfo}>
              <Text style={styles.usageText}>
                Daily generations used: {limits.dailyRecipeGenerations - remainingGenerations}/{limits.dailyRecipeGenerations}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setShowUpgradeModal(true)}
          >
            <Zap size={16} color={theme.colors.warning} />
            <Text style={[styles.upgradeText, { color: theme.colors.warning }]}>Upgrade Now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <SubscriptionModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSubscribe={(tierId) => {
          // This will be implemented with RevenueCat
          console.log('Subscribe to:', tierId);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  gateContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  gateGradient: {
    padding: 32,
    alignItems: 'center',
  },
  gateIcon: {
    position: 'relative',
    marginBottom: 16,
  },
  sparkle: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  gateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gateSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  gateDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  usageInfo: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  usageText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  upgradeText: {
    fontSize: 16,
    fontWeight: '700',
  },
});