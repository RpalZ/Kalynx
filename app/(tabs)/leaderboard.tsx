import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Award, TrendingUp, RefreshCw, Crown, Star, Target, Zap, Sparkles, Users, Calendar, ChartBar as BarChart3, Swords, ArrowUp, ArrowDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
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
  const [fadeAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    checkAuth();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        fetchLeaderboard();
      }
    }, [currentUser])
  );

  useEffect(() => {
    if (leaderboardData) {
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [leaderboardData]);

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
        return <Medal size={22} color="#C0C0C0" />;
      case 3:
        return <Award size={20} color="#CD7F32" />;
      default:
        return (
          <View style={[styles.rankNumberContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.rankNumber, { color: theme.colors.text }]}>{rank}</Text>
          </View>
        );
    }
  };

  const LeaderboardItem = ({ entry, isCurrentUser = false }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) => (
    <Animated.View style={[
      styles.leaderboardItem,
      { 
        backgroundColor: theme.colors.card,
        borderColor: isCurrentUser ? theme.colors.primary : theme.colors.border,
        opacity: fadeAnimation,
        transform: [{
          translateY: fadeAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          })
        }]
      },
      isCurrentUser && styles.currentUserItem,
    ]}>
      <View style={styles.itemContent}>
        <View style={styles.rankContainer}>
          {getRankIcon(entry.rank)}
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.userNameContainer}>
            <Text style={[
              styles.userName, 
              { color: theme.colors.text },
              isCurrentUser && { fontWeight: '700' }
            ]}>
              {entry.name}
              {isCurrentUser && ' (You)'}
            </Text>
            {entry.rank <= 3 && (
              <View style={[styles.topBadge, { backgroundColor: theme.colors.warning }]}>
                <Text style={styles.topBadgeText}>TOP {entry.rank}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.userStats, { color: theme.colors.textSecondary }]}>
            {entry.days_active} days active • Avg: {entry.avg_combined_score}
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.combinedScore, { color: theme.colors.text }]}>
            {entry.avg_combined_score}
          </Text>
          <View style={styles.subScores}>
            <View style={styles.subScore}>
              <Zap size={12} color={theme.colors.secondary} />
              <Text style={[styles.subScoreValue, { color: theme.colors.textSecondary }]}>
                {entry.avg_fitness_score}
              </Text>
            </View>
            <View style={styles.subScore}>
              <Star size={12} color={theme.colors.success} />
              <Text style={[styles.subScoreValue, { color: theme.colors.textSecondary }]}>
                {entry.avg_eco_score}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, { backgroundColor: theme.colors.card }]}>
            <Trophy size={48} color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading leaderboard...</Text>
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
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Leaderboard</Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                {leaderboardData ? `${leaderboardData.period.days} days of competition` : 'See how you rank against others'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: theme.colors.surface }]}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Animated.View style={{
                transform: [{
                  rotate: refreshing ? '360deg' : '0deg'
                }]
              }}>
                <RefreshCw size={20} color={theme.colors.textSecondary} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Position Card */}
        {userRank && (
          <View style={styles.section}>
            <View style={[styles.userPositionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <LinearGradient
                colors={[theme.colors.gradient.primary[0], theme.colors.gradient.primary[1]]}
                style={styles.userPositionGradient}
              >
                <View style={styles.userPositionContent}>
                  <View style={styles.userPositionLeft}>
                    <Text style={styles.userPositionTitle}>Your Position</Text>
                    <Text style={styles.userPositionRank}>#{userRank.rank}</Text>
                  </View>
                  <View style={styles.userPositionRight}>
                    <Text style={styles.userPositionScore}>{userRank.avg_combined_score}</Text>
                    <Text style={styles.userPositionLabel}>Score</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Leaderboard List */}
        {leaderboardData && leaderboardData.leaderboard.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Rankings</Text>
              <View style={styles.periodBadge}>
                <Calendar size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.periodText, { color: theme.colors.textSecondary }]}>
                  {leaderboardData.period.days}d
                </Text>
              </View>
            </View>
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

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={[styles.tipCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.tipIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                <TrendingUp size={20} color={theme.colors.success} />
              </View>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Stay Consistent</Text>
                <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                  Log meals and workouts daily for better scores
                </Text>
              </View>
            </View>
            
            <View style={[styles.tipCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.tipIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
                <Target size={20} color={theme.colors.warning} />
              </View>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Balance is Key</Text>
                <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                  Mix fitness goals with eco-friendly choices
                </Text>
              </View>
            </View>
            
            <View style={[styles.tipCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.tipIcon, { backgroundColor: `${theme.colors.accent}20` }]}>
                <Sparkles size={20} color={theme.colors.accent} />
              </View>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Quality Over Quantity</Text>
                <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                  Focus on sustainable habits for long-term success
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {(!leaderboardData || leaderboardData.leaderboard.length === 0) && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.card }]}>
              <Trophy size={64} color={theme.colors.disabled} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Rankings Yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Start tracking your meals and workouts to join the competition!
              </Text>
            </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userPositionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  userPositionGradient: {
    padding: 20,
  },
  userPositionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userPositionLeft: {
    flex: 1,
  },
  userPositionTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  userPositionRank: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userPositionRight: {
    alignItems: 'flex-end',
  },
  userPositionScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userPositionLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
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
  currentUserItem: {
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    borderWidth: 1,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginRight: 16,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  topBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userStats: {
    fontSize: 13,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  combinedScore: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subScores: {
    flexDirection: 'row',
    gap: 8,
  },
  subScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  subScoreValue: {
    fontSize: 11,
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
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 32,
  },
});