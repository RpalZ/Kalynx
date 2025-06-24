import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Camera, TrendingUp, Leaf, Flame, Target, RefreshCw, Utensils, Dumbbell, Droplet, Award, Calendar, Zap } from 'lucide-react-native';
import { router, Link, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';

const { width } = Dimensions.get('window');

interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCO2e: number;
  totalWater: number;
  caloriesBurned: number;
  netCalories: number;
  mealsCount: number;
  workoutsCount: number;
}

interface DailyScore {
  fitness_score: number;
  eco_score: number;
  combined_score: number;
}

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { isDesktop, isTablet, getColumns, getSpacing } = useResponsive();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [score, setScore] = useState<DailyScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  React.useLayoutEffect(() => {
    checkAuth();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/auth');
      return;
    }
    setUser(user);
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      const token = session.session.access_token;

      // Fetch daily summary
      const summaryResponse = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-daily-summary?date=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      }

      // Calculate and fetch daily score
      const scoreResponse = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/calculate-score`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ date: today }),
        }
      );

      if (scoreResponse.ok) {
        const scoreData = await scoreResponse.json();
        setScore(scoreData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const ScoreRing = ({ score, size = 80, strokeWidth = 8, color }: any) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <View style={{ width: size, height: size, position: 'relative' }}>
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: strokeWidth,
          borderColor: theme.colors.border,
        }}>
          <View style={{
            position: 'absolute',
            width: size - strokeWidth,
            height: size - strokeWidth,
            borderRadius: (size - strokeWidth) / 2,
            borderWidth: strokeWidth / 2,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate: `${(score / 100) * 360}deg` }],
          }} />
          <Text style={[styles.scoreText, { color: theme.colors.text, fontSize: isDesktop ? 20 : 16 }]}>{score}</Text>
        </View>
      </View>
    );
  };

  const MetricCard = ({ title, value, unit, icon: Icon, color, trend, bgGradient }: any) => (
    <View style={[
      styles.metricCard, 
      { 
        backgroundColor: theme.colors.card, 
        borderColor: theme.colors.border,
        minHeight: isDesktop ? 140 : 120,
      }
    ]}>
      <LinearGradient
        colors={bgGradient || [theme.colors.surface, theme.colors.surface]}
        style={styles.metricGradient}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIconContainer, { backgroundColor: `${color}20` }]}>
            <Icon size={isDesktop ? 24 : 20} color={color} />
          </View>
          {trend && (
            <View style={[styles.trendContainer, { backgroundColor: trend > 0 ? '#10B98120' : '#EF444420' }]}>
              <TrendingUp size={12} color={trend > 0 ? '#10B981' : '#EF4444'} />
              <Text style={[styles.trendText, { color: trend > 0 ? '#10B981' : '#EF4444' }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.metricValue, { color, fontSize: isDesktop ? 28 : 24 }]}>{value}</Text>
        <Text style={[styles.metricTitle, { color: theme.colors.textSecondary, fontSize: isDesktop ? 16 : 14 }]}>{title}</Text>
        <Text style={[styles.metricUnit, { color: theme.colors.placeholder, fontSize: isDesktop ? 14 : 12 }]}>{unit}</Text>
      </LinearGradient>
    </View>
  );

  const QuickActionCard = ({ title, subtitle, icon: Icon, color, gradient, onPress }: any) => (
    <TouchableOpacity 
      style={[
        styles.quickActionCard, 
        { 
          height: isDesktop ? 160 : isTablet ? 140 : 120,
          minWidth: isDesktop ? 200 : isTablet ? 180 : 160,
        }
      ]} 
      onPress={onPress}
    >
      <LinearGradient colors={gradient} style={styles.quickActionGradient}>
        <View style={styles.quickActionContent}>
          <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Icon size={isDesktop ? 32 : 24} color="#FFFFFF" />
          </View>
          <View style={styles.quickActionText}>
            <Text style={[styles.quickActionTitle, { fontSize: isDesktop ? 20 : 18 }]}>{title}</Text>
            <Text style={[styles.quickActionSubtitle, { fontSize: isDesktop ? 15 : 13 }]}>{subtitle}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ResponsiveContainer>
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.loadingSpinner, { borderColor: theme.colors.border, borderTopColor: theme.colors.primary }]} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading your dashboard...</Text>
            </View>
          </View>
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.gradient.primary[0], theme.colors.gradient.primary[1]]}
          style={[styles.header, { paddingBottom: isDesktop ? 48 : 32 }]}
        >
          <ResponsiveContainer>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={[styles.greeting, { fontSize: isDesktop ? 18 : 16 }]}>{getGreeting()},</Text>
                <Text style={[styles.userName, { fontSize: isDesktop ? 36 : 28 }]}>{user?.user_metadata?.name || 'there'}!</Text>
                <Text style={[styles.subtitle, { fontSize: isDesktop ? 18 : 16 }]}>Ready to make a positive impact today?</Text>
              </View>
              <TouchableOpacity 
                style={[styles.refreshButton, { width: isDesktop ? 56 : 48, height: isDesktop ? 56 : 48 }]}
                onPress={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw size={isDesktop ? 28 : 24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Hero Image */}
            <View style={[styles.heroImageContainer, { height: isDesktop ? 160 : 120 }]}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800' }}
                style={styles.heroImage}
              />
            </View>
          </ResponsiveContainer>
        </LinearGradient>

        <ResponsiveContainer>
          {/* Quick Actions */}
          <View style={[styles.section, { paddingVertical: getSpacing(20, 24, 32) }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: isDesktop ? 26 : 22 }]}>Quick Actions</Text>
            <ResponsiveGrid
              columns={{ mobile: 2, tablet: 2, desktop: 4, largeDesktop: 4 }}
              gap={getSpacing(16, 20, 24)}
            >
              <QuickActionCard
                title="Log Meal"
                subtitle="Track nutrition & impact"
                icon={Utensils}
                gradient={['#10B981', '#059669']}
                onPress={() => router.push('/meals')}
              />
              <QuickActionCard
                title="Log Workout"
                subtitle="Record your activity"
                icon={Dumbbell}
                gradient={['#3B82F6', '#2563EB']}
                onPress={() => router.push('/workouts')}
              />
              <QuickActionCard
                title="Scan Fridge"
                subtitle="AI recipe suggestions"
                icon={Camera}
                gradient={['#8B5CF6', '#7C3AED']}
                onPress={() => router.push('/(tabs)/camera' as any)}
              />
              <QuickActionCard
                title="View Progress"
                subtitle="See your achievements"
                icon={Award}
                gradient={['#F59E0B', '#D97706']}
                onPress={() => router.push('/(tabs)/leaderboard')}
              />
            </ResponsiveGrid>
          </View>

          {/* Performance Scores */}
          {score && (
            <View style={[styles.section, { paddingVertical: getSpacing(20, 24, 32) }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: isDesktop ? 26 : 22 }]}>Today's Performance</Text>
              <View style={[styles.scoresCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <LinearGradient
                  colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#F1F5F9']}
                  style={[styles.scoresGradient, { padding: getSpacing(24, 28, 32) }]}
                >
                  <View style={[
                    styles.scoresContainer,
                    isDesktop && { justifyContent: 'space-around', maxWidth: 600, alignSelf: 'center' }
                  ]}>
                    <View style={styles.scoreItem}>
                      <ScoreRing score={score.fitness_score} color={theme.colors.secondary} size={isDesktop ? 100 : 80} />
                      <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary, fontSize: isDesktop ? 16 : 14 }]}>Fitness</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <ScoreRing score={score.eco_score} color={theme.colors.success} size={isDesktop ? 100 : 80} />
                      <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary, fontSize: isDesktop ? 16 : 14 }]}>Eco Impact</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <ScoreRing score={score.combined_score} color={theme.colors.accent} size={isDesktop ? 120 : 100} strokeWidth={isDesktop ? 12 : 10} />
                      <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary, fontSize: isDesktop ? 16 : 14 }]}>Overall</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Today's Metrics */}
          {summary && (
            <View style={[styles.section, { paddingVertical: getSpacing(20, 24, 32) }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: isDesktop ? 26 : 22 }]}>Today's Metrics</Text>
              <ResponsiveGrid
                columns={{ mobile: 2, tablet: 3, desktop: 3, largeDesktop: 6 }}
                gap={getSpacing(12, 16, 20)}
              >
                <MetricCard
                  title="Calories Consumed"
                  value={summary.totalCalories.toFixed(0)}
                  unit="kcal"
                  icon={Flame}
                  color={theme.colors.error}
                  trend={5}
                  bgGradient={isDark ? ['#FEF2F2', '#FEE2E2'] : ['#FEF2F2', '#FECACA']}
                />
                <MetricCard
                  title="Protein Intake"
                  value={Math.round(summary.totalProtein)}
                  unit="grams"
                  icon={TrendingUp}
                  color={theme.colors.secondary}
                  trend={-2}
                  bgGradient={isDark ? ['#EBF5FF', '#DBEAFE'] : ['#EBF5FF', '#BFDBFE']}
                />
                <MetricCard
                  title="CO₂ Impact"
                  value={summary.totalCO2e.toFixed(1)}
                  unit="kg saved"
                  icon={Leaf}
                  color={theme.colors.success}
                  trend={12}
                  bgGradient={isDark ? ['#F0FDF4', '#DCFCE7'] : ['#F0FDF4', '#BBF7D0']}
                />
                <MetricCard
                  title="Water Impact"
                  value={summary.totalWater.toFixed(0)}
                  unit="liters"
                  icon={Droplet}
                  color={theme.colors.info}
                  trend={8}
                  bgGradient={isDark ? ['#EFF6FF', '#DBEAFE'] : ['#EFF6FF', '#BFDBFE']}
                />
                <MetricCard
                  title="Calories Burned"
                  value={summary.caloriesBurned}
                  unit="kcal"
                  icon={Zap}
                  color={theme.colors.warning}
                  trend={15}
                  bgGradient={isDark ? ['#FFFBEB', '#FEF3C7'] : ['#FFFBEB', '#FDE68A']}
                />
                <MetricCard
                  title="Net Balance"
                  value={Math.abs(summary.netCalories).toFixed(0)}
                  unit={summary.netCalories > 0 ? 'surplus' : 'deficit'}
                  icon={Target}
                  color={summary.netCalories > 0 ? theme.colors.error : theme.colors.success}
                  bgGradient={summary.netCalories > 0 ? 
                    (isDark ? ['#FEF2F2', '#FEE2E2'] : ['#FEF2F2', '#FECACA']) :
                    (isDark ? ['#F0FDF4', '#DCFCE7'] : ['#F0FDF4', '#BBF7D0'])
                  }
                />
              </ResponsiveGrid>
            </View>
          )}

          {/* Activity Summary */}
          {summary && (
            <View style={[styles.section, { paddingVertical: getSpacing(20, 24, 32) }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: isDesktop ? 26 : 22 }]}>Activity Summary</Text>
              <View style={[styles.activityCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <LinearGradient
                  colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                  style={[styles.activityGradient, { padding: getSpacing(24, 28, 32) }]}
                >
                  <View style={styles.activityHeader}>
                    <Calendar size={isDesktop ? 24 : 20} color={theme.colors.accent} />
                    <Text style={[styles.activityTitle, { color: theme.colors.text, fontSize: isDesktop ? 22 : 18 }]}>Today's Progress</Text>
                  </View>
                  <View style={[
                    styles.activityStats,
                    isDesktop && { justifyContent: 'space-around', maxWidth: 600, alignSelf: 'center' }
                  ]}>
                    <View style={styles.activityStat}>
                      <View style={[styles.activityStatIcon, { backgroundColor: `${theme.colors.success}20`, width: isDesktop ? 40 : 32, height: isDesktop ? 40 : 32 }]}>
                        <Utensils size={isDesktop ? 20 : 16} color={theme.colors.success} />
                      </View>
                      <Text style={[styles.activityStatValue, { color: theme.colors.text, fontSize: isDesktop ? 24 : 20 }]}>{summary.mealsCount}</Text>
                      <Text style={[styles.activityStatLabel, { color: theme.colors.textSecondary, fontSize: isDesktop ? 14 : 12 }]}>Meals Logged</Text>
                    </View>
                    <View style={styles.activityStat}>
                      <View style={[styles.activityStatIcon, { backgroundColor: `${theme.colors.secondary}20`, width: isDesktop ? 40 : 32, height: isDesktop ? 40 : 32 }]}>
                        <Dumbbell size={isDesktop ? 20 : 16} color={theme.colors.secondary} />
                      </View>
                      <Text style={[styles.activityStatValue, { color: theme.colors.text, fontSize: isDesktop ? 24 : 20 }]}>{summary.workoutsCount}</Text>
                      <Text style={[styles.activityStatLabel, { color: theme.colors.textSecondary, fontSize: isDesktop ? 14 : 12 }]}>Workouts Done</Text>
                    </View>
                    <View style={styles.activityStat}>
                      <View style={[styles.activityStatIcon, { 
                        backgroundColor: `${summary.netCalories > 0 ? theme.colors.error : theme.colors.success}20`,
                        width: isDesktop ? 40 : 32, 
                        height: isDesktop ? 40 : 32 
                      }]}>
                        <Target size={isDesktop ? 20 : 16} color={summary.netCalories > 0 ? theme.colors.error : theme.colors.success} />
                      </View>
                      <Text style={[styles.activityStatValue, { 
                        color: summary.netCalories > 0 ? theme.colors.error : theme.colors.success,
                        fontSize: isDesktop ? 24 : 20 
                      }]}>
                        {summary.netCalories > 0 ? '+' : ''}{summary.netCalories.toFixed(0)}
                      </Text>
                      <Text style={[styles.activityStatLabel, { color: theme.colors.textSecondary, fontSize: isDesktop ? 14 : 12 }]}>Net Calories</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}
        </ResponsiveContainer>

        {/* Bottom Spacing */}
        <View style={[styles.bottomSpacing, { height: getSpacing(32, 40, 48) }]} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 0,
    paddingTop: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: '#E9D5FF',
    fontWeight: '500',
  },
  userName: {
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    color: '#D1FAE5',
    lineHeight: 22,
  },
  refreshButton: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  section: {
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  quickActionCard: {
    aspectRatio: 1.2,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionGradient: {
    flex: 1,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  quickActionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    gap: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    alignItems: 'center',
  },
  quickActionTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    textAlign: 'center',
  },
  scoresCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  scoresGradient: {
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  scoreItem: {
    alignItems: 'center',
    gap: 12,
  },
  scoreText: {
    fontWeight: '700',
  },
  scoreLabel: {
    fontWeight: '600',
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  metricGradient: {
    padding: 16,
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    fontWeight: '700',
    marginBottom: 4,
  },
  metricTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  metricUnit: {
    fontWeight: '500',
  },
  activityCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  activityGradient: {
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  activityTitle: {
    fontWeight: '700',
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityStat: {
    alignItems: 'center',
    gap: 8,
  },
  activityStatIcon: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityStatValue: {
    fontWeight: '700',
  },
  activityStatLabel: {
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomSpacing: {
  },
});