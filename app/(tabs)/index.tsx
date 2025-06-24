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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Camera, TrendingUp, Leaf, Flame, Target, RefreshCw, Utensils, Dumbbell, Droplet, Award, Calendar, Zap } from 'lucide-react-native';
import { router, Link, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

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
          <Text style={[styles.scoreText, { color: theme.colors.text }]}>{score}</Text>
        </View>
      </View>
    );
  };

  const MetricCard = ({ title, value, unit, icon: Icon, color, trend, bgGradient }: any) => (
    <View style={[styles.metricCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <LinearGradient
        colors={bgGradient || [theme.colors.surface, theme.colors.surface]}
        style={styles.metricGradient}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIconContainer, { backgroundColor: `${color}20` }]}>
            <Icon size={20} color={color} />
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
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
        <Text style={[styles.metricTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.metricUnit, { color: theme.colors.placeholder }]}>{unit}</Text>
      </LinearGradient>
    </View>
  );

  const QuickActionCard = ({ title, subtitle, icon: Icon, color, gradient, onPress }: any) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <LinearGradient colors={gradient} style={styles.quickActionGradient}>
        <View style={styles.quickActionContent}>
          <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Icon size={24} color="#FFFFFF" />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>{title}</Text>
            <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.loadingSpinner, { borderColor: theme.colors.border, borderTopColor: theme.colors.primary }]} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading your dashboard...</Text>
          </View>
        </View>
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
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{user?.user_metadata?.name || 'there'}!</Text>
              <Text style={styles.subtitle}>Ready to make a positive impact today?</Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Hero Image */}
          <View style={styles.heroImageContainer}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.heroImage}
            />
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
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
          </View>
        </View>

        {/* Performance Scores */}
        {score && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Performance</Text>
            <View style={[styles.scoresCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <LinearGradient
                colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#F1F5F9']}
                style={styles.scoresGradient}
              >
                <View style={styles.scoresContainer}>
                  <View style={styles.scoreItem}>
                    <ScoreRing score={score.fitness_score} color={theme.colors.secondary} />
                    <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Fitness</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <ScoreRing score={score.eco_score} color={theme.colors.success} />
                    <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Eco Impact</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <ScoreRing score={score.combined_score} color={theme.colors.accent} size={100} strokeWidth={10} />
                    <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Overall</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Today's Metrics */}
        {summary && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Metrics</Text>
            <View style={styles.metricsGrid}>
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
            </View>
          </View>
        )}

        {/* Activity Summary */}
        {summary && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Activity Summary</Text>
            <View style={[styles.activityCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <LinearGradient
                colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                style={styles.activityGradient}
              >
                <View style={styles.activityHeader}>
                  <Calendar size={20} color={theme.colors.accent} />
                  <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Today's Progress</Text>
                </View>
                <View style={styles.activityStats}>
                  <View style={styles.activityStat}>
                    <View style={[styles.activityStatIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                      <Utensils size={16} color={theme.colors.success} />
                    </View>
                    <Text style={[styles.activityStatValue, { color: theme.colors.text }]}>{summary.mealsCount}</Text>
                    <Text style={[styles.activityStatLabel, { color: theme.colors.textSecondary }]}>Meals Logged</Text>
                  </View>
                  <View style={styles.activityStat}>
                    <View style={[styles.activityStatIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                      <Dumbbell size={16} color={theme.colors.secondary} />
                    </View>
                    <Text style={[styles.activityStatValue, { color: theme.colors.text }]}>{summary.workoutsCount}</Text>
                    <Text style={[styles.activityStatLabel, { color: theme.colors.textSecondary }]}>Workouts Done</Text>
                  </View>
                  <View style={styles.activityStat}>
                    <View style={[styles.activityStatIcon, { backgroundColor: `${summary.netCalories > 0 ? theme.colors.error : theme.colors.success}20` }]}>
                      <Target size={16} color={summary.netCalories > 0 ? theme.colors.error : theme.colors.success} />
                    </View>
                    <Text style={[styles.activityStatValue, { color: summary.netCalories > 0 ? theme.colors.error : theme.colors.success }]}>
                      {summary.netCalories > 0 ? '+' : ''}{summary.netCalories.toFixed(0)}
                    </Text>
                    <Text style={[styles.activityStatLabel, { color: theme.colors.textSecondary }]}>Net Calories</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
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
    fontSize: 16,
    color: '#E9D5FF',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#D1FAE5',
    lineHeight: 22,
  },
  refreshButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroImageContainer: {
    height: 120,
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionGradient: {
    padding: 20,
    minHeight: 100,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
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
    padding: 24,
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
    fontSize: 18,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricUnit: {
    fontSize: 12,
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
    padding: 24,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 18,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  activityStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
});