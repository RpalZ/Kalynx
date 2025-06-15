import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

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
        return <Text style={styles.rankNumber}>{rank}</Text>;
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
        return '#6B7280';
    }
  };

  const LeaderboardItem = ({ entry, isCurrentUser = false }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) => (
    <View style={[
      styles.leaderboardItem,
      isCurrentUser && styles.currentUserItem,
      entry.rank <= 3 && styles.topThreeItem
    ]}>
      <View style={styles.rankContainer}>
        {getRankIcon(entry.rank)}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
          {entry.name}
        </Text>
        <Text style={styles.userStats}>
          {entry.days_active} days active • Avg: {entry.avg_combined_score}
        </Text>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={[styles.combinedScore, { color: getRankColor(entry.rank) }]}>
          {entry.avg_combined_score}
        </Text>
        <View style={styles.subScores}>
          <View style={styles.subScore}>
            <Text style={styles.subScoreLabel}>Fitness</Text>
            <Text style={styles.subScoreValue}>{entry.avg_fitness_score}</Text>
          </View>
          <View style={styles.subScore}>
            <Text style={styles.subScoreLabel}>Eco</Text>
            <Text style={styles.subScoreValue}>{entry.avg_eco_score}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#A855F7']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>
          {leaderboardData ? `Past ${leaderboardData.period.days} days` : 'Community rankings'}
        </Text>
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
            <Text style={styles.sectionTitle}>Your Ranking</Text>
            <LeaderboardItem entry={userRank} isCurrentUser={true} />
          </View>
        )}

        {/* Top Performers */}
        {leaderboardData && leaderboardData.leaderboard.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
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
          <Text style={styles.sectionTitle}>How to Climb the Ranks</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <TrendingUp size={20} color="#16A34A" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Stay Active Daily</Text>
                <Text style={styles.tipText}>
                  Log workouts and meals consistently to maintain your score
                </Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <Trophy size={20} color="#F59E0B" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Balance Fitness & Eco</Text>
                <Text style={styles.tipText}>
                  High scores come from both burning calories and making sustainable choices
                </Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <Award size={20} color="#7C3AED" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Consistency is Key</Text>
                <Text style={styles.tipText}>
                  Regular activity over 7 days counts more than one perfect day
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {(!leaderboardData || leaderboardData.leaderboard.length === 0) && (
          <View style={styles.emptyState}>
            <Trophy size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
            <Text style={styles.emptySubtitle}>
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
    backgroundColor: '#F9FAFB',
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
    color: '#111827',
    marginBottom: 16,
  },
  leaderboardContainer: {
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#6B7280',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  currentUserText: {
    color: '#16A34A',
  },
  userStats: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#9CA3AF',
    marginBottom: 2,
  },
  subScoreValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});