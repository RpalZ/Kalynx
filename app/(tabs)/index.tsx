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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Camera, TrendingUp, Leaf, Flame, Target } from 'lucide-react-native';
import { router, Link } from 'expo-router';
import { supabase } from '@/lib/supabase';

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
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [score, setScore] = useState<DailyScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

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

  const StatCard = ({ title, value, unit, icon: Icon, color, bgColor }: any) => (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <View style={styles.statHeader}>
        <Icon size={20} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );

  const ScoreCard = ({ title, score, color, bgColor }: any) => (
    <View style={[styles.scoreCard, { backgroundColor: bgColor }]}>
      <Text style={styles.scoreTitle}>{title}</Text>
      <Text style={[styles.scoreValue, { color }]}>{score}</Text>
      <View style={styles.scoreBar}>
        <View 
          style={[
            styles.scoreProgress, 
            { width: `${score}%`, backgroundColor: color }
          ]} 
        />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#16A34A', '#22C55E']}
          style={styles.header}
        >
          <Text style={styles.greeting}>Hello, {user?.user_metadata?.name || 'there'}!</Text>
          <Text style={styles.subtitle}>Track your sustainable health journey</Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/meals')}
            >
              <Plus size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Log Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/workouts')}
            >
              <Target size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Log Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cameraButton]}
              onPress={() => router.push('/(tabs)/camera' as any)}
            >
              <Camera size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Scan Fridge</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Scores */}
        {score && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Scores</Text>
            <View style={styles.scoresContainer}>
              <ScoreCard
                title="Fitness Score"
                score={score.fitness_score}
                color="#2563EB"
                bgColor="#EBF5FF"
              />
              <ScoreCard
                title="Eco Score"
                score={score.eco_score}
                color="#16A34A"
                bgColor="#F0FDF4"
              />
              <ScoreCard
                title="Combined Score"
                score={score.combined_score}
                color="#7C3AED"
                bgColor="#F5F3FF"
              />
            </View>
          </View>
        )}

        {/* Daily Stats */}
        {summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Calories"
                value={summary.totalCalories}
                unit="kcal"
                icon={Flame}
                color="#EF4444"
                bgColor="#FEF2F2"
              />
              <StatCard
                title="Protein"
                value={Math.round(summary.totalProtein)}
                unit="g"
                icon={TrendingUp}
                color="#2563EB"
                bgColor="#EBF5FF"
              />
              <StatCard
                title="CO₂ Impact"
                value={summary.totalCO2e.toFixed(1)}
                unit="kg"
                icon={Leaf}
                color="#16A34A"
                bgColor="#F0FDF4"
              />
              <StatCard
                title="Burned"
                value={summary.caloriesBurned}
                unit="kcal"
                icon={Target}
                color="#F59E0B"
                bgColor="#FFFBEB"
              />
            </View>
          </View>
        )}

        {/* Activity Summary */}
        {summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Summary</Text>
            <View style={styles.activitySummary}>
              <View style={styles.activityItem}>
                <Text style={styles.activityCount}>{summary.mealsCount}</Text>
                <Text style={styles.activityLabel}>Meals Logged</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityCount}>{summary.workoutsCount}</Text>
                <Text style={styles.activityLabel}>Workouts Done</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={[styles.activityCount, { color: summary.netCalories > 0 ? '#EF4444' : '#16A34A' }]}>
                  {summary.netCalories > 0 ? '+' : ''}{summary.netCalories}
                </Text>
                <Text style={styles.activityLabel}>Net Calories</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#D1FAE5',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#2563EB',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scoresContainer: {
    gap: 12,
  },
  scoreCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activitySummary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityItem: {
    flex: 1,
    alignItems: 'center',
  },
  activityCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});