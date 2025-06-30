import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, X, Check, Sparkles, Zap, Star, Shield } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SUBSCRIPTION_TIERS } from '@/types/subscription';

const { width } = Dimensions.get('window');

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (tierId: string) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
  onSubscribe,
}) => {
  const { theme, isDark } = useTheme();
  const [selectedTier, setSelectedTier] = useState('pro');

  const handleSubscribe = () => {
    // This will be implemented with RevenueCat
    onSubscribe?.(selectedTier);
    onClose();
  };

  const TierCard = ({ tier, isSelected }: { tier: any; isSelected: boolean }) => (
    <TouchableOpacity
      style={[
        styles.tierCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          borderWidth: isSelected ? 2 : 1,
        }
      ]}
      onPress={() => setSelectedTier(tier.id)}
    >
      <LinearGradient
        colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
        style={styles.tierGradient}
      >
        {tier.isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: theme.colors.warning }]}>
            <Star size={12} color="#FFFFFF" />
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}
        
        <View style={styles.tierHeader}>
          <View style={[
            styles.tierIcon,
            { backgroundColor: tier.id === 'pro' ? `${theme.colors.warning}20` : `${theme.colors.textSecondary}20` }
          ]}>
            {tier.id === 'pro' ? (
              <Crown size={24} color={theme.colors.warning} />
            ) : (
              <Shield size={24} color={theme.colors.textSecondary} />
            )}
          </View>
          <Text style={[styles.tierName, { color: theme.colors.text }]}>{tier.name}</Text>
          <View style={styles.tierPricing}>
            <Text style={[styles.tierPrice, { color: theme.colors.text }]}>{tier.price}</Text>
            <Text style={[styles.tierPeriod, { color: theme.colors.textSecondary }]}>/{tier.period}</Text>
          </View>
        </View>

        <View style={styles.tierFeatures}>
          {tier.features.map((feature: string, index: number) => (
            <View key={index} style={styles.featureItem}>
              <Check size={16} color={theme.colors.success} />
              <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>{feature}</Text>
            </View>
          ))}
        </View>

        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
            <Check size={16} color="#FFFFFF" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.gradient.warning[0], theme.colors.gradient.warning[1]]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Sparkles size={28} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Upgrade to Pro</Text>
                <Text style={styles.headerSubtitle}>Unlock unlimited recipe generations</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Why Go Pro?</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                  <Zap size={20} color={theme.colors.success} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>Unlimited Generations</Text>
                  <Text style={[styles.benefitDescription, { color: theme.colors.textSecondary }]}>
                    Generate as many recipes as you want, no daily limits
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: `${theme.colors.info}20` }]}>
                  <Star size={20} color={theme.colors.info} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>Advanced Analytics</Text>
                  <Text style={[styles.benefitDescription, { color: theme.colors.textSecondary }]}>
                    Detailed insights into your nutrition and environmental impact
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: `${theme.colors.accent}20` }]}>
                  <Crown size={20} color={theme.colors.accent} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>Priority Support</Text>
                  <Text style={[styles.benefitDescription, { color: theme.colors.textSecondary }]}>
                    Get help faster with dedicated customer support
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Subscription Tiers */}
          <View style={styles.tiersSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Choose Your Plan</Text>
            <View style={styles.tiersContainer}>
              {SUBSCRIPTION_TIERS.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  isSelected={selectedTier === tier.id}
                />
              ))}
            </View>
          </View>

          {/* Subscribe Button */}
          <View style={styles.subscribeSection}>
            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSubscribe}
            >
              <LinearGradient
                colors={[theme.colors.gradient.primary[0], theme.colors.gradient.primary[1]]}
                style={styles.subscribeGradient}
              >
                <Crown size={20} color="#FFFFFF" />
                <Text style={styles.subscribeText}>
                  {selectedTier === 'free' ? 'Continue with Free' : 'Start Pro Trial'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={[styles.subscribeNote, { color: theme.colors.textSecondary }]}>
              {selectedTier === 'pro' && '7-day free trial, then $9.99/month. Cancel anytime.'}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  benefitsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tiersSection: {
    marginBottom: 32,
  },
  tiersContainer: {
    gap: 16,
  },
  tierCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  tierGradient: {
    padding: 20,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tierHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  tierPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPrice: {
    fontSize: 24,
    fontWeight: '800',
  },
  tierPeriod: {
    fontSize: 16,
    fontWeight: '500',
  },
  tierFeatures: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeSection: {
    alignItems: 'center',
  },
  subscribeButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  subscribeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subscribeNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});