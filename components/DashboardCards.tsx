import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  Flame, 
  Leaf, 
  Droplet, 
  Target, 
  Zap,
  Calendar,
  Award,
  Users,
  BarChart3
} from 'lucide-react-native';
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
  
  const cardSizes = {
    small: { padding: 16, iconSize: 20, titleSize: 14, valueSize: 20 },
    medium: { padding: 20, iconSize: 24, titleSize: 16, valueSize: 24 },
    large: { padding: 24, iconSize: 28, titleSize: 18, valueSize: 32 },
  };
  
  const currentSize = cardSizes[size];

  return (
    <TouchableOpacity
      style={[
        styles.metricCard,
        { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          minHeight: isDesktop ? 140 : 120,
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <LinearGradient
        colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
        style={[styles.metricGradient, { padding: currentSize.padding }]}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIconContainer, { backgroundColor: `${color}20` }]}>
            <Icon size={currentSize.iconSize} color={color} />
          </View>
          {trend !== undefined && (
            <View style={[
              styles.trendContainer,
              { backgroundColor: trend > 0 ? '#10B98120' : '#EF444420' }
            ]}>
              <TrendingUp 
                size={12} 
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
            marginBottom: 8,
          }
        ]}>
          {value}
        </Text>
        
        <Text style={[
          styles.metricTitle,
          { 
            color: theme.colors.text,
            fontSize: currentSize.titleSize,
            marginBottom: 4,
          }
        ]}>
          {title}
        </Text>
        
        {subtitle && (
          <Text style={[styles.metricSubtitle, { color: theme.colors.textSecondary }]}>
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
  
  const cardSizes = {
    small: { padding: 16, iconSize: 20, titleSize: 14 },
    medium: { padding: 20, iconSize: 24, titleSize: 16 },
    large: { padding: 24, iconSize: 28, titleSize: 18 },
  };
  
  const currentSize = cardSizes[size];

  return (
    <TouchableOpacity
      style={[
        styles.quickActionCard,
        { minHeight: isDesktop ? 140 : 120 }
      ]}
      onPress={onPress}
    >
      <LinearGradient
        colors={gradient}
        style={[styles.quickActionGradient, { padding: currentSize.padding }]}
      >
        <View style={styles.quickActionContent}>
          <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Icon size={currentSize.iconSize} color="#FFFFFF" />
          </View>
          <View style={styles.quickActionText}>
            <Text style={[
              styles.quickActionTitle,
              { fontSize: currentSize.titleSize }
            ]}>
              {title}
            </Text>
            <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
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
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  metricGradient: {
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontWeight: '800',
  },
  metricTitle: {
    fontWeight: '600',
  },
  metricSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickActionCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  quickActionGradient: {
    flex: 1,
    justifyContent: 'center',
  },
  quickActionContent: {
    alignItems: 'center',
    gap: 16,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    alignItems: 'center',
  },
  quickActionTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
});