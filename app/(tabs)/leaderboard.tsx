import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Award, TrendingUp, RefreshCw, Crown, Star, Target, Zap } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

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
  const { theme, isDark } = useTheme();
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
        return <Crown size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Award size={24} color="#CD7F32" />;
      default:
        return (
          <View style={[styles.rankNumberContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.rankNumber, { color: theme.colors.text }]}>{rank}</Text>
          </View>
        );
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
      isCurrentUser && [styles.currentUserItem, { borderColor: theme.colors.success, backgroundColor: isDark ? '#064E3B20' : '#F0FDF4' }],
      entry.rank <= 3 && [styles.topThreeItem, { backgroundColor: isDark ? '#FEF3C720' : '#FFFBEB' }]
    ]}>
      <LinearGradient
        colors={
          isCurrentUser 
            ? [theme.colors.success + '10', theme.colors.success + '05']
            : entry.rank <= 3 
              ? ['#FEF3C7', '#FDE68A']
              : isDark 
                ? ['#1E293B', '#334155'] 
                : ['#FFFFFF', '#F8FAFC']
        }
        style={styles.leaderboardItemGradient}
      >
        <View style={styles.rankContainer}>
          {getRankIcon(entry.rank)}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[
            styles.userName, 
            { color: theme.colors.text }, 
            isCurrentUser && { fontWeight: '700', color: theme.colors.success }
          ]}>
            {entry.name}
            {isCurrentUser && ' (You)'}
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
              <View style={[styles.subScoreIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                <Zap size={10} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.subScoreValue, { color: theme.colors.textSecondary }]}>{entry.avg_fitness_score}</Text>
            </View>
            <View style={styles.subScore}>
              <View style={[styles.subScoreIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                <Star size={10} color={theme.colors.success} />
              </View>
              <Text style={[styles.subScoreValue, { color: theme.colors.textSecondary }]}>{entry.avg_eco_score}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, { backgroundColor: theme.colors.card }]}>
            <Trophy size={48} color={theme.colors.warning} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading leaderboard...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.gradient.warning[0], theme.colors.gradient.warning[1]]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
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
        
        {/* Hero Image */}
        <View style={styles.heroImageContainer}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800' }}
            style={styles.heroImage}
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
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
              <LinearGradient
                colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                style={styles.tipCardGradient}
              >
                <View style={[styles.tipIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                  <TrendingUp size={20} color={theme.colors.success} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Stay Active Daily</Text>
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                    Log workouts and meals consistently to maintain your score
                  </Text>
                </View>
              </LinearGradient>
            </View>
            <View style={[styles.tipCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <LinearGradient
                colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                style={styles.tipCardGradient}
              >
                <View style={[styles.tipIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
                  <Trophy size={20} color={theme.colors.warning} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Balance Fitness & Eco</Text>
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                    High scores come from both burning calories and making sustainable choices
                  </Text>
                </View>
              </LinearGradient>
            </View>
            <View style={[styles.tipCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <LinearGradient
                colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                style={styles.tipCardGradient}
              >
                <View style={[styles.tipIcon, { backgroundColor: `${theme.colors.accent}20` }]}>
                  <Award size={20} color={theme.colors.accent} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Consistency is Key</Text>
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                    Regular activity over 7 days counts more than one perfect day
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {(!leaderboardData || leaderboardData.leaderboard.length === 0) && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
              <Trophy size={48} color={theme.colors.warning} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Rankings Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Start logging meals and workouts to see community rankings
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
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
    fontSize: 16,
    marginTop: 16,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FEF3C7',
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageContainer: {
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    opacity: 0.8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  leaderboardContainer: {
    gap: 12,
  },
  leaderboardItem: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  leaderboardItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  currentUserItem: {
    borderWidth: 2,
  },
  topThreeItem: {
    borderColor: '#F59E0B',
  },
  rankContainer: {
    width: 48,
    alignItems: 'center',
    marginRight: 16,
  },
  rankNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginRight: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userStats: {
    fontSize: 12,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  combinedScore: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subScores: {
    flexDirection: 'row',
    gap: 12,
  },
  subScore: {
    alignItems: 'center',
    gap: 4,
  },
  subScoreIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subScoreValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  tipsContainer: {
    gap: 16,
  },
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tipCardGradient: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
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
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 32,
  },
});