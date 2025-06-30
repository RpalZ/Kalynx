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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Camera, TrendingUp, Leaf, Flame, Target, RefreshCw, Utensils, Dumbbell, Droplet, Award, Calendar, Zap } from 'lucide-react-native';
import { router, Link, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import ChartWidget from '@/components/ChartWidget';
import { ResponsiveGrid, GridItem } from '@/components/ResponsiveGrid';
import { MetricCard, QuickActionCard, StatsOverview } from '@/components/DashboardCards';

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
  const [loadingStates, setLoadingStates] = useState({
    summary: true,
    score: true,
    user: true,
  });

  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const isTablet = Platform.OS === 'web' && width >= 768 && width < 1024;
  const isMobile = width < 768;

  React.useLayoutEffect(() => {
    checkAuth();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchDashboardData();
      }
    }, [user])
  );

  const checkAuth = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, user: true }));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }
      setUser(user);
      setLoadingStates(prev => ({ ...prev, user: false }));
      fetchDashboardData();
    } catch (error) {
      console.error('Auth check error:', error);
      setLoadingStates(prev => ({ ...prev, user: false }));
    }
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

      // Fetch daily summary with timeout
      setLoadingStates(prev => ({ ...prev, summary: true }));
      const summaryController = new AbortController();
      const summaryTimeout = setTimeout(() => summaryController.abort(), 10000); // 10 second timeout

      try {
        const summaryResponse = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-daily-summary?date=${today}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            signal: summaryController.signal,
          }
        );

        clearTimeout(summaryTimeout);

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
        } else {
          console.error('Summary fetch failed:', summaryResponse.status);
          // Set default summary data for offline/error state
          setSummary({
            date: today,
            totalCalories: 0,
            totalProtein: 0,
            totalCO2e: 0,
            totalWater: 0,
            caloriesBurned: 0,
            netCalories: 0,
            mealsCount: 0,
            workoutsCount: 0,
          });
        }
      } catch (summaryError) {
        console.error('Summary fetch error:', summaryError);
        // Set default summary data
        setSummary({
          date: today,
          totalCalories: 0,
          totalProtein: 0,
          totalCO2e: 0,
          totalWater: 0,
          caloriesBurned: 0,
          netCalories: 0,
          mealsCount: 0,
          workoutsCount: 0,
        });
      } finally {
        setLoadingStates(prev => ({ ...prev, summary: false }));
      }

      // Calculate and fetch daily score with timeout
      setLoadingStates(prev => ({ ...prev, score: true }));
      const scoreController = new AbortController();
      const scoreTimeout = setTimeout(() => scoreController.abort(), 10000); // 10 second timeout

      try {
        const scoreResponse = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/calculate-score`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: today }),
            signal: scoreController.signal,
          }
        );

        clearTimeout(scoreTimeout);

        if (scoreResponse.ok) {
          const scoreData = await scoreResponse.json();
          setScore(scoreData);
        } else {
          console.error('Score fetch failed:', scoreResponse.status);
          // Set default score data
          setScore({
            fitness_score: 0,
            eco_score: 0,
            combined_score: 0,
          });
        }
      } catch (scoreError) {
        console.error('Score fetch error:', scoreError);
        // Set default score data
        setScore({
          fitness_score: 0,
          eco_score: 0,
          combined_score: 0,
        });
      } finally {
        setLoadingStates(prev => ({ ...prev, score: false }));
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

  const handleCardPress = (type: string) => {
    switch (type) {
      case 'meals':
        router.push('/(tabs)/meals');
        break;
      case 'workouts':
        router.push('/(tabs)/workouts');
        break;
      case 'leaderboard':
        router.push('/(tabs)/leaderboard');
        break;
      case 'profile':
        router.push('/(tabs)/profile');
        break;
      default:
        break;
    }
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

  // Show loading state while checking auth or initial load
  if (loadingStates.user || (isLoading && !summary && !score)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, { backgroundColor: theme.colors.card }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
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
        contentContainerStyle={isDesktop ? styles.desktopContent : undefined}
      >
        {/* Header - Only show on mobile/tablet */}
        {!isDesktop && (
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
          </LinearGradient>
        )}

        {/* Desktop Welcome Section */}
        {isDesktop && (
          <View style={styles.desktopWelcome}>
            <Text style={[styles.desktopGreeting, { color: theme.colors.text }]}>
              {getGreeting()}, {user?.user_metadata?.name || 'there'}!
            </Text>
            <Text style={[styles.desktopSubtitle, { color: theme.colors.textSecondary }]}>
              Here's your sustainability and fitness overview for today
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={[styles.section, isDesktop && styles.desktopSection]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
          {loadingStates.summary ? (
            <View style={styles.quickActionsLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading actions...</Text>
            </View>
          ) : (
            <View style={styles.quickActionsContainer}>
              <QuickActionCard
                title="Log Meal"
                subtitle="Track nutrition & impact"
                icon={Utensils}
                gradient={['#10B981', '#059669']}
                onPress={() => router.push('/(tabs)/meals')}
                size={isDesktop ? 'medium' : 'small'}
              />
              <QuickActionCard
                title="Log Workout"
                subtitle="Record your activity"
                icon={Dumbbell}
                gradient={['#3B82F6', '#2563EB']}
                onPress={() => router.push('/(tabs)/workouts')}
                size={isDesktop ? 'medium' : 'small'}
              />
              <QuickActionCard
                title="Scan Fridge"
                subtitle="AI recipe suggestions"
                icon={Camera}
                gradient={['#8B5CF6', '#7C3AED']}
                onPress={() => router.push('/(tabs)/camera' as any)}
                size={isDesktop ? 'medium' : 'small'}
              />
              <QuickActionCard
                title="View Progress"
                subtitle="See your achievements"
                icon={Award}
                gradient={['#F59E0B', '#D97706']}
                onPress={() => router.push('/(tabs)/leaderboard')}
                size={isDesktop ? 'medium' : 'small'}
              />
            </View>
          )}
        </View>

        {/* Stats Overview */}
        <View style={[styles.section, styles.compactSection, isDesktop && styles.desktopSection]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Overview</Text>
          {loadingStates.summary ? (
            <View style={styles.statsLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading stats...</Text>
            </View>
          ) : summary ? (
            <View style={styles.statsContainer}>
              <MetricCard
                title="Meals Logged"
                value={summary.mealsCount}
                subtitle="today"
                icon={Target}
                color={theme.colors.success}
                trend={5}
                onPress={() => handleCardPress('meals')}
                size={isDesktop ? 'medium' : 'small'}
              />
              <MetricCard
                title="Workouts"
                value={summary.workoutsCount}
                subtitle="completed"
                icon={Zap}
                color={theme.colors.secondary}
                trend={-2}
                onPress={() => handleCardPress('workouts')}
                size={isDesktop ? 'medium' : 'small'}
              />
              <MetricCard
                title="Calories"
                value={summary.totalCalories.toFixed(0)}
                subtitle="consumed"
                icon={Flame}
                color={theme.colors.error}
                trend={12}
                size={isDesktop ? 'medium' : 'small'}
              />
              <MetricCard
                title="CO₂ Impact"
                value={`${summary.totalCO2e.toFixed(1)}kg`}
                subtitle="saved"
                icon={Leaf}
                color={theme.colors.success}
                trend={8}
                size={isDesktop ? 'medium' : 'small'}
              />
              <MetricCard
                title="Water Impact"
                value={`${summary.totalWater.toFixed(0)}L`}
                subtitle="used"
                icon={Droplet}
                color={theme.colors.info}
                trend={15}
                size={isDesktop ? 'medium' : 'small'}
              />
              <MetricCard
                title="Net Balance"
                value={Math.abs(summary.netCalories).toFixed(0)}
                subtitle={summary.netCalories > 0 ? 'surplus' : 'deficit'}
                icon={Target}
                color={summary.netCalories > 0 ? theme.colors.error : theme.colors.success}
                size={isDesktop ? 'medium' : 'small'}
              />
            </View>
          ) : (
            <View style={styles.errorState}>
              <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
                Unable to load stats. Pull to refresh.
              </Text>
            </View>
          )}
        </View>

        {/* Chart Widget */}
        <View style={[styles.section, styles.compactSection, isDesktop && styles.desktopSection]}>
          <ChartWidget />
        </View>

        {/* Performance Scores */}
        <View style={[styles.section, styles.compactSection, isDesktop && styles.desktopSection]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Performance</Text>
          {loadingStates.score ? (
            <View style={styles.scoresLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading scores...</Text>
            </View>
          ) : score ? (
            <View style={[styles.scoresCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <LinearGradient
                colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#F1F5F9']}
                style={styles.scoresGradient}
              >
                <View style={styles.scoresContainer}>
                  <View style={styles.scoreItem}>
                    <ScoreRing 
                      score={score.fitness_score} 
                      color={theme.colors.secondary} 
                      size={isMobile ? 70 : 80}
                      strokeWidth={isMobile ? 6 : 8}
                    />
                    <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Fitness</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <ScoreRing 
                      score={score.eco_score} 
                      color={theme.colors.success} 
                      size={isMobile ? 70 : 80}
                      strokeWidth={isMobile ? 6 : 8}
                    />
                    <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Eco Impact</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <ScoreRing 
                      score={score.combined_score} 
                      color={theme.colors.accent} 
                      size={isMobile ? 80 : 100} 
                      strokeWidth={isMobile ? 8 : 10} 
                    />
                    <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Overall</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.errorState}>
              <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
                Unable to load performance scores. Pull to refresh.
              </Text>
            </View>
          )}
        </View>

        {/* Activity Summary */}
        {summary && (
          <View style={[styles.section, styles.compactSection, isDesktop && styles.desktopSection]}>
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
  desktopContent: {
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
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
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickActionsLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statsLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  scoresLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    lineHeight: 20,
  },
  refreshButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  desktopWelcome: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 16,
  },
  desktopGreeting: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  desktopSubtitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  compactSection: {
    paddingVertical: 8, // Reduced from 16 to 8
  },
  desktopSection: {
    paddingHorizontal: 32,
    paddingVertical: 16, // Reduced from 24 to 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
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
    height: 20, // Reduced from 32 to 20
  },
});