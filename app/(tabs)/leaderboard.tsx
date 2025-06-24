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
import { Trophy, Medal, Award, TrendingUp, RefreshCw, Crown, Star, Target, Zap, Flame, Sparkles } from 'lucide-react-native';
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
        return <Crown size={28} color="#FFD700" />;
      case 2:
        return <Medal size={28} color="#E5E7EB" />;
      case 3:
        return <Award size={28} color="#CD7F32" />;
      default:
        return (
          <View style={[styles.rankNumberContainer, { 
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            borderColor: isDark ? '#4B5563' : '#D1D5DB'
          }]}>
            <Text style={[styles.rankNumber, { 
              color: isDark ? '#E5E7EB' : '#374151',
              fontWeight: '800'
            }]}>{rank}</Text>
          </View>
        );
    }
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return ['#FFD700', '#FFA500'];
      case 2:
        return ['#E5E7EB', '#9CA3AF'];
      case 3:
        return ['#CD7F32', '#A0522D'];
      default:
        return isDark ? ['#374151', '#4B5563'] : ['#F9FAFB', '#F3F4F6'];
    }
  };

  const getScoreColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return isDark ? '#E5E7EB' : '#374151';
    }
  };

  const LeaderboardItem = ({ entry, isCurrentUser = false }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) => (
    <View style={[
      styles.leaderboardItem,
      { 
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        borderColor: isDark ? '#374151' : '#E5E7EB',
        shadowColor: isDark ? '#000000' : '#000000',
      },
      isCurrentUser && [styles.currentUserItem, { 
        borderColor: '#10B981',
        backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
        shadowColor: '#10B981'
      }],
      entry.rank <= 3 && [styles.topThreeItem, { 
        backgroundColor: isDark ? '#1E1B4B' : '#FEF3C7',
        borderColor: entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : '#CD7F32'
      }]
    ]}>
      <LinearGradient
        colors={
          isCurrentUser 
            ? isDark ? ['#064E3B', '#065F46'] : ['#ECFDF5', '#D1FAE5']
            : entry.rank <= 3 
              ? getRankGradient(entry.rank)
              : isDark 
                ? ['#1F2937', '#374151'] 
                : ['#FFFFFF', '#F9FAFB']
        }
        style={styles.leaderboardItemGradient}
      >
        <View style={styles.rankContainer}>
          {getRankIcon(entry.rank)}
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.userNameContainer}>
            <Text style={[
              styles.userName, 
              { 
                color: entry.rank <= 3 
                  ? isDark ? '#FFFFFF' : '#1F2937'
                  : isDark ? '#F3F4F6' : '#1F2937'
              }, 
              isCurrentUser && { fontWeight: '800', color: '#10B981' }
            ]}>
              {entry.name}
              {isCurrentUser && ' (You)'}
            </Text>
            {entry.rank <= 3 && (
              <View style={[styles.topBadge, { backgroundColor: getScoreColor(entry.rank) }]}>
                <Text style={styles.topBadgeText}>TOP {entry.rank}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.userStats, { 
            color: entry.rank <= 3 
              ? isDark ? '#E5E7EB' : '#6B7280'
              : isDark ? '#9CA3AF' : '#6B7280'
          }]}>
            {entry.days_active} days active • Avg: {entry.avg_combined_score}
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.combinedScore, { 
            color: getScoreColor(entry.rank),
            fontSize: entry.rank <= 3 ? 28 : 24,
            fontWeight: '900'
          }]}>
            {entry.avg_combined_score}
          </Text>
          <View style={styles.subScores}>
            <View style={styles.subScore}>
              <View style={[styles.subScoreIcon, { backgroundColor: '#3B82F620' }]}>
                <Zap size={12} color="#3B82F6" />
              </View>
              <Text style={[styles.subScoreValue, { 
                color: isDark ? '#CBD5E1' : '#6B7280',
                fontWeight: '700'
              }]}>{entry.avg_fitness_score}</Text>
            </View>
            <View style={styles.subScore}>
              <View style={[styles.subScoreIcon, { backgroundColor: '#10B98120' }]}>
                <Star size={12} color="#10B981" />
              </View>
              <Text style={[styles.subScoreValue, { 
                color: isDark ? '#CBD5E1' : '#6B7280',
                fontWeight: '700'
              }]}>{entry.avg_eco_score}</Text>
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
          <LinearGradient
            colors={isDark ? ['#1F2937', '#374151'] : ['#FFFFFF', '#F9FAFB']}
            style={[styles.loadingCard, { borderColor: theme.colors.border }]}
          >
            <View style={[styles.loadingIcon, { backgroundColor: '#F59E0B20' }]}>
              <Trophy size={48} color="#F59E0B" />
            </View>
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading leaderboard...</Text>
            <Text style={[styles.loadingSubtext, { color: theme.colors.textSecondary }]}>
              Calculating rankings and scores
            </Text>
          </LinearGradient>
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
          colors={['#F59E0B', '#D97706']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerTitleContainer}>
                <Trophy size={32} color="#FFFFFF" />
                <Text style={styles.headerTitle}>Leaderboard</Text>
              </View>
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
              source={{ uri: 'https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.heroImage}
            />
            <View style={styles.heroOverlay} />
          </View>
        </LinearGradient>

        {/* Current User's Rank */}
        {userRank && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={20} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Ranking</Text>
            </View>
            <LeaderboardItem entry={userRank} isCurrentUser={true} />
          </View>
        )}

        {/* Top Performers */}
        {leaderboardData && leaderboardData.leaderboard.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Crown size={20} color="#FFD700" />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Top Performers</Text>
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

        {/* Achievement Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>How to Climb the Ranks</Text>
          </View>
          <View style={styles.tipsContainer}>
            <View style={[styles.tipCard, { 
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }]}>
              <LinearGradient
                colors={isDark ? ['#1F2937', '#374151'] : ['#FFFFFF', '#F9FAFB']}
                style={styles.tipCardGradient}
              >
                <View style={[styles.tipIcon, { backgroundColor: '#10B98120' }]}>
                  <TrendingUp size={24} color="#10B981" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Stay Active Daily</Text>
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                    Log workouts and meals consistently to maintain your score
                  </Text>
                </View>
              </LinearGradient>
            </View>
            
            <View style={[styles.tipCard, { 
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }]}>
              <LinearGradient
                colors={isDark ? ['#1F2937', '#374151'] : ['#FFFFFF', '#F9FAFB']}
                style={styles.tipCardGradient}
              >
                <View style={[styles.tipIcon, { backgroundColor: '#F59E0B20' }]}>
                  <Trophy size={24} color="#F59E0B" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Balance Fitness & Eco</Text>
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                    High scores come from both burning calories and making sustainable choices
                  </Text>
                </View>
              </LinearGradient>
            </View>
            
            <View style={[styles.tipCard, { 
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }]}>
              <LinearGradient
                colors={isDark ? ['#1F2937', '#374151'] : ['#FFFFFF', '#F9FAFB']}
                style={styles.tipCardGradient}
              >
                <View style={[styles.tipIcon, { backgroundColor: '#8B5CF620' }]}>
                  <Flame size={24} color="#8B5CF6" />
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
            <LinearGradient
              colors={isDark ? ['#1F2937', '#374151'] : ['#FFFFFF', '#F9FAFB']}
              style={[styles.emptyCard, { borderColor: theme.colors.border }]}
            >
              <View style={[styles.emptyIcon, { backgroundColor: '#F59E0B20' }]}>
                <Trophy size={64} color="#F59E0B" />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Rankings Yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Start logging meals and workouts to see community rankings
              </Text>
            </LinearGradient>
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
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    maxWidth: 320,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    textAlign: 'center',
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FEF3C7',
    fontWeight: '500',
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
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  leaderboardContainer: {
    gap: 16,
  },
  leaderboardItem: {
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  leaderboardItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  currentUserItem: {
    borderWidth: 3,
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  topThreeItem: {
    borderWidth: 3,
    shadowOpacity: 0.15,
  },
  rankContainer: {
    width: 56,
    alignItems: 'center',
    marginRight: 16,
  },
  rankNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '800',
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
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  topBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userStats: {
    fontSize: 13,
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  combinedScore: {
    fontSize: 24,
    fontWeight: '900',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subScoreValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipsContainer: {
    gap: 16,
  },
  tipCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tipCardGradient: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    maxWidth: 320,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 32,
  },
});