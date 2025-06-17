import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Award, TrendingUp, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  email: string;
  avg_combined_score: number;
  avg_fitness_score: number;
  avg_eco_score: number;
  days_active: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
}

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/auth');
      return;
    }
    setCurrentUser(user);
    fetchLeaderboard();
  };

  const fetchLeaderboard = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-leaderboard`,
        {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data: LeaderboardData = await response.json();
        setLeaderboardData(data);
        
        // Find current user's rank
        const currentUserEntry = data.leaderboard.find(entry => entry.user_id === currentUser?.id);
        setUserRank(currentUserEntry || null);
      } else {
        Alert.alert('Error', 'Failed to load leaderboard');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      Alert.alert('Error', 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Award size={24} color="#CD7F32" />;
      default:
        return <Text style={[styles.rankNumber, { color: theme.colors.textSecondary }]}>{rank}</Text>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return theme.colors.textSecondary;
    }
  };

  const LeaderboardItem = ({ entry, isCurrentUser = false }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) => (
    <View style={[
      styles.leaderboardItem,
      { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      isCurrentUser && styles.currentUserItem,
      entry.rank <= 3 && styles.topThreeItem
    ]}>
      <View style={styles.rankContainer}>
        {getRankIcon(entry.rank)}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.colors.text }, isCurrentUser && styles.currentUserText]}>
          {entry.name}
        </Text>
        <Text style={[styles.userStats, { color: theme.colors.textSecondary }]}>
          {entry.days_active} days active • Avg: {entry.avg_combined_score}
        </Text>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={[styles.combinedScore, { color: getRankColor(entry.rank) }]}>
          {entry.avg_combined_score}
        </Text>
        <View style={styles.subScores}>
          <View style={styles.subScore}>
            <Text style={[styles.subScoreLabel, { color: theme.colors.placeholder }]}>Fitness</Text>
            <Text style={[styles.subScoreValue, { color: theme.colors.textSecondary }]}>{entry.avg_fitness_score}</Text>
          </View>
          <View style={styles.subScore}>
            <Text style={[styles.subScoreLabel, { color: theme.colors.placeholder }]}>Eco</Text>
            <Text style={[styles.subScoreValue, { color: theme.colors.textSecondary }]}>{entry.avg_eco_score}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.gradient.primary[0], theme.colors.gradient.primary[1]] as const}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <Text style={styles.headerSubtitle}>
              {leaderboardData ? `Past ${leaderboardData.period.days} days` : 'Community rankings'}
            </Text>
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

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current User's Rank */}
        {userRank && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Ranking</Text>
            <LeaderboardItem entry={userRank} isCurrentUser={true} />
          </View>
        )}

        {/* Top Performers */}
        {leaderboardData && leaderboardData.leaderboard.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Top Performers</Text>
            <View style={styles.leaderboardContainer}>
              {leaderboardData.leaderboard.map((entry) => (
                <LeaderboardItem
                  key={entry.user_id}
                  entry={entry}
                  isCurrentUser={entry.user_id === currentUser?.id}
                />
              ))}
            </View>
          </View>
        )}

        {/* Achievement Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>How to Climb the Ranks</Text>
          <View style={styles.tipsContainer}>
            <View style={[styles.tipCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <TrendingUp size={20} color={theme.colors.success} />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Stay Active Daily</Text>
                <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                  Log workouts and meals consistently to maintain your score
                </Text>
              </View>
            </View>
            <View style={[styles.tipCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Trophy size={20} color={theme.colors.warning} />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Balance Fitness & Eco</Text>
                <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                  High scores come from both burning calories and making sustainable choices
                </Text>
              </View>
            </View>
            <View style={[styles.tipCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Award size={20} color={theme.colors.accent} />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Consistency is Key</Text>
                <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                  Regular activity over 7 days counts more than one perfect day
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {(!leaderboardData || leaderboardData.leaderboard.length === 0) && (
          <View style={styles.emptyState}>
            <Trophy size={48} color={theme.colors.disabled} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Rankings Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Start logging meals and workouts to see community rankings
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    padding: 24,
    paddingBottom: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E9D5FF',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  leaderboardContainer: {
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  currentUserItem: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
    borderWidth: 2,
  },
  topThreeItem: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentUserText: {
    color: '#16A34A',
  },
  userStats: {
    fontSize: 12,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  combinedScore: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subScores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subScore: {
    alignItems: 'center',
    flex: 1,
    minWidth: '48%',
  },
  subScoreLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  subScoreValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  refreshButton: {
    padding: 8,
  },
});