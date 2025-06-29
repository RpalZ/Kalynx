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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Award, TrendingUp, RefreshCw, Crown, Star, Target, Zap, Sparkles, Users, Calendar, ChartBar as BarChart3, Swords, ArrowUp, ArrowDown, Flame, Shield } from 'lucide-react-native';
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
  const [sparkleAnimation] = useState(new Animated.Value(0));
  const [battleAnimation] = useState(new Animated.Value(0));

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

      // Start sparkle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start battle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(battleAnimation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(battleAnimation, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
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

  const getNextTarget = () => {
    if (!userRank || !leaderboardData) return null;
    return leaderboardData.leaderboard.find(entry => entry.rank === userRank.rank - 1);
  };

  const getPointsToNext = () => {
    const nextTarget = getNextTarget();
    if (!nextTarget || !userRank) return 0;
    return nextTarget.avg_combined_score - userRank.avg_combined_score;
  };

  const CompetitionArena = () => {
    const nextTarget = getNextTarget();
    const pointsToNext = getPointsToNext();

    if (!userRank) {
      return (
        <View style={styles.arenaContainer}>
          <LinearGradient
            colors={['#FF6B35', '#F7931E', '#FFD23F']}
            style={styles.noRankArena}
          >
            <Animated.View style={[
              styles.arenaIcon,
              {
                transform: [{
                  rotate: sparkleAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }]
              }
            ]}>
              <Trophy size={40} color="#FFFFFF" />
            </Animated.View>
            <View style={styles.arenaInfo}>
              <Text style={styles.arenaTitle}>Join the Competition!</Text>
              <Text style={styles.arenaSubtitle}>Start tracking to climb the ranks</Text>
            </View>
            <Animated.View style={{
              opacity: sparkleAnimation,
            }}>
              <Sparkles size={24} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={styles.arenaContainer}>
        {/* Battle Arena */}
        <LinearGradient
          colors={['#8B5CF6', '#A855F7', '#C084FC']}
          style={styles.battleSection}
        >
          <View style={styles.battleHeader}>
            <Animated.View style={{
              transform: [{
                rotate: battleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '15deg'],
                })
              }]
            }}>
              <Swords size={20} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.battleTitle}>Competition Arena</Text>
            <Animated.View style={{
              opacity: sparkleAnimation,
            }}>
              <Sparkles size={16} color="#FFFFFF" />
            </Animated.View>
          </View>
          
          <View style={styles.battleStats}>
            <View style={styles.battleStat}>
              <Shield size={16} color="#FFFFFF" />
              <Text style={styles.battleStatLabel}>Your Rank</Text>
              <Text style={styles.battleStatValue}>#{userRank.rank}</Text>
            </View>
            <View style={styles.battleStat}>
              <Flame size={16} color="#FFFFFF" />
              <Text style={styles.battleStatLabel}>Score</Text>
              <Text style={styles.battleStatValue}>{userRank.avg_combined_score}</Text>
            </View>
            {nextTarget && (
              <View style={styles.battleStat}>
                <Target size={16} color="#FFFFFF" />
                <Text style={styles.battleStatLabel}>To Next</Text>
                <Text style={styles.battleStatValue}>+{pointsToNext}</Text>
              </View>
            )}
          </View>

          {nextTarget && (
            <View style={styles.targetProgress}>
              <Text style={styles.progressLabel}>Next Target: {nextTarget.name}</Text>
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min((userRank.avg_combined_score / nextTarget.avg_combined_score) * 100, 95)}%`,
                    }
                  ]}
                />
                <Animated.View style={[
                  styles.progressSparkle,
                  {
                    opacity: sparkleAnimation,
                    transform: [{
                      translateX: sparkleAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 100],
                      })
                    }]
                  }
                ]}>
                  <Sparkles size={8} color="#FFD700" />
                </Animated.View>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
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
        {/* Gamified Header */}
        <LinearGradient
          colors={[theme.colors.gradient.primary[0], theme.colors.gradient.primary[1]]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerTitleContainer}>
                <Animated.View style={{
                  transform: [{
                    rotate: sparkleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '15deg'],
                    })
                  }]
                }}>
                  <Trophy size={32} color="#FFFFFF" />
                </Animated.View>
                <Text style={styles.headerTitle}>Leaderboard</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                {leaderboardData ? `${leaderboardData.period.days} days of competition` : 'See how you rank against others'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Animated.View style={{
                transform: [{
                  rotate: refreshing ? '360deg' : '0deg'
                }]
              }}>
                <RefreshCw size={20} color="#FFFFFF" />
              </Animated.View>
            </TouchableOpacity>
          </View>
          
          {/* Competition Arena */}
          <CompetitionArena />
        </LinearGradient>

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
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Competition Arena Styles
  arenaContainer: {
    gap: 16,
  },
  noRankArena: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  arenaIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arenaInfo: {
    flex: 1,
  },
  arenaTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  arenaSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  
  // Battle Section
  battleSection: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  battleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  battleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  battleStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  battleStat: {
    alignItems: 'center',
    gap: 4,
  },
  battleStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  battleStatValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  targetProgress: {
    gap: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressSparkle: {
    position: 'absolute',
    top: -2,
    left: 0,
  },
  
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
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