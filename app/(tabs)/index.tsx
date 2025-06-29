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

const CARD_SIZE_WEB = 220;
const CARD_SIZE_MOBILE = Math.min(width * 0.44, 180);

const GAP = 16;
const CARDS_PER_ROW = 2;
const MAX_CARD_SIZE = 162;
const windowWidth = Dimensions.get('window').width;
const gridPadding = 40; // section padding left+right
const baseCardSize = (windowWidth - gridPadding - GAP * (CARDS_PER_ROW - 1)) / CARDS_PER_ROW;
const cardSize = Math.min(baseCardSize * 0.9, MAX_CARD_SIZE);

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [score, setScore] = useState<DailyScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const isTablet = Platform.OS === 'web' && width >= 768 && width < 1024;

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
          <ResponsiveGrid
            columns={{ mobile: 2, tablet: 2, desktop: 4 }}
            gap={16}
          >
            <GridItem>
              <QuickActionCard
                title="Log Meal"
                subtitle="Track nutrition & impact"
                icon={Utensils}
                gradient={['#10B981', '#059669']}
                onPress={() => router.push('/meals')}
                size={isDesktop ? 'medium' : 'small'}
              />
            </GridItem>
            <GridItem>
              <QuickActionCard
                title="Log Workout"
                subtitle="Record your activity"
                icon={Dumbbell}
                gradient={['#3B82F6', '#2563EB']}
                onPress={() => router.push('/workouts')}
                size={isDesktop ? 'medium' : 'small'}
              />
            </GridItem>
            <GridItem>
              <QuickActionCard
                title="Scan Fridge"
                subtitle="AI recipe suggestions"
                icon={Camera}
                gradient={['#8B5CF6', '#7C3AED']}
                onPress={() => router.push('/(tabs)/camera' as any)}
                size={isDesktop ? 'medium' : 'small'}
              />
            </GridItem>
            <GridItem>
              <QuickActionCard
                title="View Progress"
                subtitle="See your achievements"
                icon={Award}
                gradient={['#F59E0B', '#D97706']}
                onPress={() => router.push('/(tabs)/leaderboard')}
                size={isDesktop ? 'medium' : 'small'}
              />
            </GridItem>
          </ResponsiveGrid>
        </View>

        {/* Stats Overview */}
        {summary && (
          <View style={[styles.section, isDesktop && styles.desktopSection]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Overview</Text>
            <ResponsiveGrid
              columns={{ mobile: 2, tablet: 3, desktop: 6 }}
              gap={16}
            >
              <GridItem>
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
              </GridItem>
              <GridItem>
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
              </GridItem>
              <GridItem>
                <MetricCard
                  title="Calories"
                  value={summary.totalCalories.toFixed(0)}
                  subtitle="consumed"
                  icon={Flame}
                  color={theme.colors.error}
                  trend={12}
                  size={isDesktop ? 'medium' : 'small'}
                />
              </GridItem>
              <GridItem>
                <MetricCard
                  title="CO₂ Impact"
                  value={`${summary.totalCO2e.toFixed(1)}kg`}
                  subtitle="saved"
                  icon={Leaf}
                  color={theme.colors.success}
                  trend={8}
                  size={isDesktop ? 'medium' : 'small'}
                />
              </GridItem>
              <GridItem>
                <MetricCard
                  title="Water Impact"
                  value={`${summary.totalWater.toFixed(0)}L`}
                  subtitle="used"
                  icon={Droplet}
                  color={theme.colors.info}
                  trend={15}
                  size={isDesktop ? 'medium' : 'small'}
                />
              </GridItem>
              <GridItem>
                <MetricCard
                  title="Net Balance"
                  value={Math.abs(summary.netCalories).toFixed(0)}
                  subtitle={summary.netCalories > 0 ? 'surplus' : 'deficit'}
                  icon={Target}
                  color={summary.netCalories > 0 ? theme.colors.error : theme.colors.success}
                  size={isDesktop ? 'medium' : 'small'}
                />
              </GridItem>
            </ResponsiveGrid>
          </View>
        )}

        {/* Chart Widget */}
        <View style={[styles.section, isDesktop && styles.desktopSection]}>
          <ChartWidget />
        </View>

        {/* Performance Scores */}
        {score && (
          <View style={[styles.section, isDesktop && styles.desktopSection]}>
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

        {/* Activity Summary */}
        {summary && (
          <View style={[styles.section, isDesktop && styles.desktopSection]}>
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
    padding: 20,
  },
  desktopSection: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 22,
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
    height: 32,
  },
});