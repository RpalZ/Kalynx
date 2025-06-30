import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Flame, Leaf, Droplet, Target, Zap, Calendar, Award, Users, ChartBar as BarChart3 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: string;
  trend?: number;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onPress,
  size = 'medium',
}) => {
  const { theme, isDark } = useTheme();
  const isDesktop = Platform.OS === 'web' && screenWidth >= 1024;
  const isTablet = Platform.OS === 'web' && screenWidth >= 768 && screenWidth < 1024;
  const isMobile = screenWidth < 768;
  
  // Calculate responsive dimensions
  const getCardWidth = () => {
    if (isDesktop) {
      return (screenWidth - 128) / 3 - 16; // 3 columns with padding
    } else if (isTablet) {
      return (screenWidth - 80) / 2 - 12; // 2 columns with padding
    } else {
      return (screenWidth - 56) / 2 - 6; // 2 columns with padding for mobile
    }
  };

  const cardWidth = getCardWidth();
  
  const cardSizes = {
    small: { 
      padding: isMobile ? 12 : 16, 
      iconSize: isMobile ? 16 : 20, 
      titleSize: isMobile ? 10 : 12, 
      valueSize: isMobile ? 16 : 18, 
      minHeight: isMobile ? 100 : 110,
    },
    medium: { 
      padding: isMobile ? 14 : 18, 
      iconSize: isMobile ? 18 : 22, 
      titleSize: isMobile ? 11 : 13, 
      valueSize: isMobile ? 18 : 22, 
      minHeight: isMobile ? 110 : 120,
    },
    large: { 
      padding: isMobile ? 16 : 20, 
      iconSize: isMobile ? 20 : 24, 
      titleSize: isMobile ? 12 : 14, 
      valueSize: isMobile ? 20 : 24, 
      minHeight: isMobile ? 120 : 130,
    },
  };
  
  const currentSize = cardSizes[size];

  return (
    <TouchableOpacity
      style={[
        styles.metricCard,
        { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          minHeight: currentSize.minHeight,
          width: cardWidth,
          maxWidth: cardWidth,
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
        style={[styles.metricGradient, { padding: currentSize.padding }]}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIconContainer, { backgroundColor: `${color}20` }]}>
            <Icon size={currentSize.iconSize} color={color} />
          </View>
          {trend !== undefined && !isMobile && (
            <View style={[
              styles.trendContainer,
              { backgroundColor: trend > 0 ? '#10B98120' : '#EF444420' }
            ]}>
              <TrendingUp 
                size={8} 
                color={trend > 0 ? '#10B981' : '#EF4444'} 
                style={{ transform: [{ rotate: trend > 0 ? '0deg' : '180deg' }] }}
              />
              <Text style={[
                styles.trendText,
                { color: trend > 0 ? '#10B981' : '#EF4444' }
              ]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[
          styles.metricValue,
          { 
            color: color,
            fontSize: currentSize.valueSize,
            marginBottom: isMobile ? 4 : 6,
          }
        ]} numberOfLines={1}>
          {value}
        </Text>
        
        <Text style={[
          styles.metricTitle,
          { 
            color: theme.colors.text,
            fontSize: currentSize.titleSize,
            marginBottom: 2,
            lineHeight: currentSize.titleSize * 1.2,
          }
        ]} numberOfLines={1}>
          {title}
        </Text>
        
        {subtitle && (
          <Text style={[
            styles.metricSubtitle, 
            { 
              color: theme.colors.textSecondary,
              fontSize: isMobile ? 9 : 10,
            }
          ]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: any;
  gradient: string[];
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  gradient,
  onPress,
  size = 'medium',
}) => {
  const isDesktop = Platform.OS === 'web' && screenWidth >= 1024;
  const isTablet = Platform.OS === 'web' && screenWidth >= 768 && screenWidth < 1024;
  const isMobile = screenWidth < 768;
  
  // Calculate responsive dimensions
  const getCardWidth = () => {
    if (isDesktop) {
      return (screenWidth - 128) / 4 - 12; // 4 columns with padding
    } else if (isTablet) {
      return (screenWidth - 80) / 2 - 12; // 2 columns with padding
    } else {
      return (screenWidth - 56) / 2 - 6; // 2 columns with padding for mobile
    }
  };

  const cardWidth = getCardWidth();
  
  const cardSizes = {
    small: { 
      padding: isMobile ? 12 : 16, 
      iconSize: isMobile ? 18 : 22, 
      titleSize: isMobile ? 11 : 13, 
      subtitleSize: isMobile ? 9 : 11,
      minHeight: isMobile ? 100 : 110,
    },
    medium: { 
      padding: isMobile ? 14 : 18, 
      iconSize: isMobile ? 20 : 24, 
      titleSize: isMobile ? 12 : 14, 
      subtitleSize: isMobile ? 10 : 12,
      minHeight: isMobile ? 110 : 120,
    },
    large: { 
      padding: isMobile ? 16 : 20, 
      iconSize: isMobile ? 22 : 26, 
      titleSize: isMobile ? 13 : 15, 
      subtitleSize: isMobile ? 11 : 13,
      minHeight: isMobile ? 120 : 130,
    },
  };
  
  const currentSize = cardSizes[size];

  return (
    <TouchableOpacity
      style={[
        styles.quickActionCard,
        { 
          minHeight: currentSize.minHeight,
          width: cardWidth,
          maxWidth: cardWidth,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={gradient}
        style={[styles.quickActionGradient, { padding: currentSize.padding }]}
      >
        <View style={styles.quickActionContent}>
          <View style={[
            styles.quickActionIcon, 
            { 
              backgroundColor: 'rgba(255,255,255,0.2)',
              width: isMobile ? 36 : 44,
              height: isMobile ? 36 : 44,
              borderRadius: isMobile ? 10 : 12,
              marginBottom: isMobile ? 8 : 12,
            }
          ]}>
            <Icon size={currentSize.iconSize} color="#FFFFFF" />
          </View>
          <View style={styles.quickActionText}>
            <Text style={[
              styles.quickActionTitle,
              { 
                fontSize: currentSize.titleSize,
                lineHeight: currentSize.titleSize * 1.2,
                marginBottom: isMobile ? 2 : 4,
              }
            ]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[
              styles.quickActionSubtitle,
              {
                fontSize: currentSize.subtitleSize,
                lineHeight: currentSize.subtitleSize * 1.3,
              }
            ]} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

interface StatsOverviewProps {
  stats: {
    totalMeals: number;
    totalWorkouts: number;
    avgScore: number;
    currentStreak: number;
    co2Saved: number;
    waterSaved: number;
  };
  onCardPress?: (type: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  onCardPress,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.statsGrid}>
      <MetricCard
        title="Meals Logged"
        value={stats.totalMeals}
        subtitle="this week"
        icon={Target}
        color={theme.colors.success}
        trend={12}
        onPress={() => onCardPress?.('meals')}
        size="medium"
      />
      
      <MetricCard
        title="Workouts"
        value={stats.totalWorkouts}
        subtitle="completed"
        icon={Zap}
        color={theme.colors.secondary}
        trend={8}
        onPress={() => onCardPress?.('workouts')}
        size="medium"
      />
      
      <MetricCard
        title="Avg Score"
        value={stats.avgScore}
        subtitle="combined"
        icon={BarChart3}
        color={theme.colors.accent}
        trend={5}
        onPress={() => onCardPress?.('leaderboard')}
        size="medium"
      />
      
      <MetricCard
        title="Current Streak"
        value={`${stats.currentStreak} days`}
        icon={Calendar}
        color={theme.colors.warning}
        onPress={() => onCardPress?.('profile')}
        size="medium"
      />
      
      <MetricCard
        title="CO₂ Saved"
        value={`${stats.co2Saved.toFixed(1)}kg`}
        subtitle="this month"
        icon={Leaf}
        color={theme.colors.success}
        trend={15}
        size="medium"
      />
      
      <MetricCard
        title="Water Saved"
        value={`${stats.waterSaved.toFixed(0)}L`}
        subtitle="this month"
        icon={Droplet}
        color={theme.colors.info}
        trend={10}
        size="medium"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  metricCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  metricGradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  metricIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  trendText: {
    fontSize: 9,
    fontWeight: '600',
  },
  metricValue: {
    fontWeight: '800',
    marginBottom: 2,
  },
  metricTitle: {
    fontWeight: '600',
    marginBottom: 1,
  },
  metricSubtitle: {
    fontWeight: '500',
  },
  quickActionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionGradient: {
    flex: 1,
    justifyContent: 'center',
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    alignItems: 'center',
  },
  quickActionTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  quickActionSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
});