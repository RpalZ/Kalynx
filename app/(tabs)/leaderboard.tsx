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
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Award, TrendingUp, RefreshCw, Crown, Star, Target, Zap, Flame, Sparkles, Shield, Users, Calendar, ChartBar as BarChart3, Swords, ArrowUp, ArrowDown, ChefHat, Utensils } from 'lucide-react-native';
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
  const [battleAnimation] = useState(new Animated.Value(0));
  const [progressAnimation] = useState(new Animated.Value(0));
  const [sparkleAnimation] = useState(new Animated.Value(0));
  const [bounceAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    checkAuth();
  }, []);

  // Auto-refresh when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        fetchLeaderboard();
      }
    }, [currentUser])
  );

  useEffect(() => {
    if (userRank && leaderboardData) {
      // Start sparkle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start bounce animation for top 3
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start battle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(battleAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(battleAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animate progress bars
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }
  }, [userRank, leaderboardData]);

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
        return (
          <Animated.View style={{
            transform: [{
              scale: bounceAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              })
            }]
          }}>
            <Crown size={36} color="#FFD700" />
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View style={{
            transform: [{
              scale: bounceAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1],
              })
            }]
          }}>
            <Medal size={34} color="#E5E7EB" />
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View style={{
            transform: [{
              scale: bounceAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.05],
              })
            }]
          }}>
            <Award size={32} color="#D97706" />
          </Animated.View>
        );
      default:
        return (
          <View style={[styles.rankNumberContainer, { 
            backgroundColor: isDark ? '#4B5563' : '#E5E7EB',
            borderColor: isDark ? '#6B7280' : '#9CA3AF'
          }]}>
            <Text style={[styles.rankNumber, { 
              color: isDark ? '#FFFFFF' : '#111827',
              fontWeight: '800'
            }]}>{rank}</Text>
          </View>
        );
    }
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return ['#FFD700', '#FF6B35', '#FF8E53'] as const; // Golden orange gradient
      case 2:
        return ['#E5E7EB', '#A78BFA', '#8B5CF6'] as const; // Silver purple gradient
      case 3:
        return ['#D97706', '#F59E0B', '#FCD34D'] as const; // Bronze yellow gradient
      default:
        return isDark ? ['#374151', '#4B5563'] as const : ['#F9FAFB', '#F3F4F6'] as const;
    }
  };

  const getScoreColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FF6B35';
      case 2:
        return '#8B5CF6';
      case 3:
        return '#F59E0B';
      default:
        return isDark ? '#F9FAFB' : '#111827';
    }
  };

  const getFoodEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🍕'; // Pizza for #1
      case 2:
        return '🍔'; // Burger for #2
      case 3:
        return '🌮'; // Taco for #3
      case 4:
        return '🍜'; // Ramen
      case 5:
        return '🥗'; // Salad
      case 6:
        return '🍝'; // Pasta
      case 7:
        return '🥙'; // Wrap
      case 8:
        return '🍲'; // Stew
      case 9:
        return '🥘'; // Paella
      case 10:
        return '🍛'; // Curry
      default:
        return '🍽️'; // Plate
    }
  };

  const getNextTarget = () => {
    if (!userRank || !leaderboardData) return null;
    
    const nextRankUser = leaderboardData.leaderboard.find(entry => entry.rank === userRank.rank - 1);
    return nextRankUser;
  };

  const getPointsToNext = () => {
    const nextTarget = getNextTarget();
    if (!nextTarget || !userRank) return 0;
    return nextTarget.avg_combined_score - userRank.avg_combined_score;
  };

  const getBattleOpponent = () => {
    if (!userRank || !leaderboardData) return null;
    
    // Find someone close in ranking for battle visualization
    const closeRanks = leaderboardData.leaderboard.filter(entry => 
      Math.abs(entry.rank - userRank.rank) <= 2 && entry.user_id !== userRank.user_id
    );
    
    return closeRanks[0] || null;
  };

  const CompetitionArena = () => {
    const nextTarget = getNextTarget();
    const pointsToNext = getPointsToNext();
    const battleOpponent = getBattleOpponent();

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
              <ChefHat size={40} color="#FFFFFF" />
            </Animated.View>
            <View style={styles.arenaInfo}>
              <Text style={styles.arenaTitle}>🍳 Join the Kitchen Battle!</Text>
              <Text style={styles.arenaSubtitle}>Start cooking up some points! 🔥</Text>
            </View>
            <Text style={styles.foodEmoji}>🍽️</Text>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={styles.arenaContainer}>
        {/* Battle Visualization */}
        {battleOpponent && (
          <LinearGradient
            colors={['#FF6B35', '#F7931E', '#FFD23F']}
            style={styles.battleSection}
          >
            <View style={styles.battleHeader}>
              <Text style={styles.battleTitle}>🔥 Kitchen Showdown! 🔥</Text>
              <Text style={styles.foodEmoji}>🍳</Text>
            </View>
            <View style={styles.battleArena}>
              {/* User Side */}
              <View style={styles.battleUser}>
                <Animated.View style={[
                  styles.battleAvatar,
                  {
                    transform: [{
                      scale: battleAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1],
                      })
                    }]
                  }
                ]}>
                  <Text style={styles.battleUserInitial}>
                    {userRank.name.charAt(0).toUpperCase()}
                  </Text>
                </Animated.View>
                <Text style={styles.battleUserName}>You 👨‍🍳</Text>
                <Text style={styles.battleUserScore}>{userRank.avg_combined_score}</Text>
                <Text style={styles.foodEmoji}>{getFoodEmoji(userRank.rank)}</Text>
              </View>

              {/* VS Indicator */}
              <View style={styles.vsIndicator}>
                <Animated.View style={[
                  styles.vsIcon,
                  {
                    transform: [{
                      rotate: battleAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }
                ]}>
                  <Utensils size={24} color="#FFFFFF" />
                </Animated.View>
                <Text style={styles.vsText}>VS</Text>
              </View>

              {/* Opponent Side */}
              <View style={styles.battleUser}>
                <Animated.View style={[
                  styles.battleAvatar,
                  styles.opponentAvatar,
                  {
                    transform: [{
                      scale: battleAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.05],
                      })
                    }]
                  }
                ]}>
                  <Text style={styles.battleUserInitial}>
                    {battleOpponent.name.charAt(0).toUpperCase()}
                  </Text>
                </Animated.View>
                <Text style={styles.battleUserName}>{battleOpponent.name} 👩‍🍳</Text>
                <Text style={styles.battleUserScore}>{battleOpponent.avg_combined_score}</Text>
                <Text style={styles.foodEmoji}>{getFoodEmoji(battleOpponent.rank)}</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Next Target Section */}
        {nextTarget && (
          <LinearGradient
            colors={['#8B5CF6', '#A855F7', '#C084FC']}
            style={styles.targetSection}
          >
            <View style={styles.targetHeader}>
              <Target size={20} color="#FFFFFF" />
              <Text style={styles.targetTitle}>🎯 Next Delicious Target</Text>
              <Text style={styles.foodEmoji}>🍰</Text>
            </View>
            
            <View style={styles.targetCard}>
              <View style={styles.targetUser}>
                <View style={styles.targetAvatar}>
                  <Text style={styles.targetInitial}>
                    {nextTarget.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.targetInfo}>
                  <Text style={styles.targetName}>{nextTarget.name} 🏆</Text>
                  <Text style={styles.targetRank}>Rank #{nextTarget.rank} • {getFoodEmoji(nextTarget.rank)}</Text>
                </View>
              </View>
              
              <View style={styles.targetProgress}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>🔥 Points to cook up</Text>
                  <Text style={styles.progressValue}>+{pointsToNext} 🌟</Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <Animated.View 
                    style={[
                      styles.progressBar,
                      {
                        width: progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', `${Math.min((userRank.avg_combined_score / nextTarget.avg_combined_score) * 100, 95)}%`],
                        })
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
                          outputRange: [0, 200],
                        })
                      }]
                    }
                  ]}>
                    <Sparkles size={12} color="#FFD700" />
                  </Animated.View>
                </View>
                
                <View style={styles.progressStats}>
                  <Text style={styles.progressStat}>You: {userRank.avg_combined_score} 🍽️</Text>
                  <Text style={styles.progressStat}>Target: {nextTarget.avg_combined_score} 🎯</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        )}
      </View>
    );
  };

  const LeaderboardItem = ({ entry, isCurrentUser = false }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) => (
    <View style={[
      styles.leaderboardItem,
      { 
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        borderColor: theme.colors.border, // Use theme border color instead of rank-specific colors
        shadowColor: isDark ? '#000000' : '#000000',
      },
      isCurrentUser && [styles.currentUserItem, { 
        borderColor: '#10B981',
        backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
        shadowColor: '#10B981'
      }],
      entry.rank <= 3 && [styles.topThreeItem, { 
        backgroundColor: isDark ? '#1E1B4B' : '#FEF3C7',
        borderColor: theme.colors.border // Use theme border instead of rank-specific colors
      }]
    ]}>
      <LinearGradient
        colors={
          isCurrentUser 
            ? ['#10B981', '#059669', '#047857'] as const
            : entry.rank <= 3 
              ? getRankGradient(entry.rank)
              : isDark 
                ? ['#1F2937', '#374151'] as const
                : ['#FFFFFF', '#F9FAFB'] as const
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
                color: entry.rank <= 3 || isCurrentUser
                  ? '#FFFFFF'
                  : isDark ? '#FFFFFF' : '#111827'
              }, 
              isCurrentUser && { fontWeight: '800' }
            ]}>
              {entry.name}
              {isCurrentUser && ' (You) 🎉'}
            </Text>
            <Text style={styles.foodEmoji}>{getFoodEmoji(entry.rank)}</Text>
            {entry.rank <= 3 && (
              <Animated.View style={[
                styles.topBadge, 
                { 
                  backgroundColor: getScoreColor(entry.rank),
                  transform: [{
                    scale: sparkleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1],
                    })
                  }]
                }
              ]}>
                <Text style={styles.topBadgeText}>TOP {entry.rank} 🏆</Text>
              </Animated.View>
            )}
          </View>
          <Text style={[styles.userStats, { 
            color: entry.rank <= 3 || isCurrentUser
              ? 'rgba(255,255,255,0.9)'
              : isDark ? '#D1D5DB' : '#6B7280'
          }]}>
            {entry.days_active} days cooking • Avg: {entry.avg_combined_score} 🔥
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.combinedScore, { 
            color: entry.rank <= 3 || isCurrentUser ? '#FFFFFF' : getScoreColor(entry.rank),
            fontSize: entry.rank <= 3 ? 32 : 28,
            fontWeight: '900'
          }]}>
            {entry.avg_combined_score}
          </Text>
          <View style={styles.subScores}>
            <View style={styles.subScore}>
              <View style={[styles.subScoreIcon, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                <Zap size={12} color="#FFFFFF" />
              </View>
              <Text style={[styles.subScoreValue, { 
                color: entry.rank <= 3 || isCurrentUser ? '#FFFFFF' : isDark ? '#E5E7EB' : '#374151',
                fontWeight: '700'
              }]}>{entry.avg_fitness_score}</Text>
            </View>
            <View style={styles.subScore}>
              <View style={[styles.subScoreIcon, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                <Star size={12} color="#FFFFFF" />
              </View>
              <Text style={[styles.subScoreValue, { 
                color: entry.rank <= 3 || isCurrentUser ? '#FFFFFF' : isDark ? '#E5E7EB' : '#374151',
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
            colors={['#FF6B35', '#F7931E', '#FFD23F']}
            style={styles.loadingCard}
          >
            <Animated.View style={{
              transform: [{
                rotate: sparkleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }}>
              <ChefHat size={64} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.loadingText}>🍳 Cooking up the leaderboard...</Text>
            <Text style={styles.loadingSubtext}>
              Mixing ingredients and calculating delicious scores! 🔥
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
        {/* Header with Competition Arena */}
        <LinearGradient
          colors={['#FF6B35', '#F7931E', '#FFD23F']}
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
                  <Trophy size={36} color="#FFFFFF" />
                </Animated.View>
                <Text style={styles.headerTitle}>🏆 Flavor Champions</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                {leaderboardData ? `🔥 ${leaderboardData.period.days} days of delicious competition! 🍽️` : 'Who\'s cooking up the best scores? 👨‍🍳'}
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
                <RefreshCw size={24} color="#FFFFFF" />
              </Animated.View>
            </TouchableOpacity>
          </View>
          
          {/* Competition Arena Content */}
          <CompetitionArena />
        </LinearGradient>

        {/* Top Performers */}
        {leaderboardData && leaderboardData.leaderboard.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Crown size={24} color="#FFD700" />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>🍕 Master Chefs Leaderboard</Text>
              <Text style={styles.foodEmoji}>🏆</Text>
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
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>🚀 Recipe for Success</Text>
            <Text style={styles.foodEmoji}>📈</Text>
          </View>
          <View style={styles.tipsContainer}>
            <LinearGradient
              colors={['#10B981', '#059669', '#047857']}
              style={styles.tipCard}
            >
              <View style={styles.tipIcon}>
                <TrendingUp size={24} color="#FFFFFF" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>🔥 Stay Cooking Daily!</Text>
                <Text style={styles.tipText}>
                  Keep the kitchen fires burning! Log meals and workouts every day 🍳
                </Text>
              </View>
              <Text style={styles.tipEmoji}>📅</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#F59E0B', '#D97706', '#B45309']}
              style={styles.tipCard}
            >
              <View style={styles.tipIcon}>
                <Trophy size={24} color="#FFFFFF" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>⚖️ Perfect Recipe Balance</Text>
                <Text style={styles.tipText}>
                  Mix fitness gains with eco-friendly choices for the ultimate flavor! 🌱💪
                </Text>
              </View>
              <Text style={styles.tipEmoji}>🥗</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
              style={styles.tipCard}
            >
              <View style={styles.tipIcon}>
                <Flame size={24} color="#FFFFFF" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>🎯 Consistency is the Secret Sauce</Text>
                <Text style={styles.tipText}>
                  Small daily portions beat one giant feast! Keep it steady 🍽️
                </Text>
              </View>
              <Text style={styles.tipEmoji}>⭐</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Empty State */}
        {(!leaderboardData || leaderboardData.leaderboard.length === 0) && (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#FF6B35', '#F7931E', '#FFD23F']}
              style={styles.emptyCard}
            >
              <Animated.View style={{
                transform: [{
                  scale: bounceAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  })
                }]
              }}>
                <ChefHat size={80} color="#FFFFFF" />
              </Animated.View>
              <Text style={styles.emptyTitle}>🍳 Kitchen's Empty!</Text>
              <Text style={styles.emptySubtitle}>
                Time to start cooking! Log some meals and workouts to join the flavor competition! 🔥👨‍🍳
              </Text>
              <Text style={styles.foodEmoji}>🍽️✨</Text>
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
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
    maxWidth: 320,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
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
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Competition Arena Styles
  arenaContainer: {
    gap: 20,
  },
  noRankArena: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  arenaIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arenaInfo: {
    flex: 1,
  },
  arenaTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 4,
  },
  arenaSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  
  // Battle Section
  battleSection: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  battleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  battleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  battleArena: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  battleUser: {
    alignItems: 'center',
    flex: 1,
  },
  battleAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  opponentAvatar: {
    backgroundColor: '#EF4444',
  },
  battleUserInitial: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  battleUserName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  battleUserScore: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vsIndicator: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  vsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  
  // Target Section
  targetSection: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  targetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 8,
  },
  targetCard: {
    gap: 16,
  },
  targetUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  targetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  targetInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  targetInfo: {
    flex: 1,
  },
  targetName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    color: '#FFFFFF',
  },
  targetRank: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  targetProgress: {
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  progressSparkle: {
    position: 'absolute',
    top: -2,
    left: 0,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
  },
  leaderboardContainer: {
    gap: 16,
  },
  leaderboardItem: {
    borderRadius: 24,
    borderWidth: 2, // Reduced from 3 to 2 for subtler borders
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  leaderboardItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  currentUserItem: {
    borderWidth: 3, // Keep thicker border for current user
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  topThreeItem: {
    borderWidth: 2, // Reduced from 4 to 2 for subtler borders
    shadowOpacity: 0.25,
  },
  rankContainer: {
    width: 64,
    alignItems: 'center',
    marginRight: 16,
  },
  rankNumberContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // Reduced from 3 to 2
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
    marginRight: 16,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
  },
  topBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userStats: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  combinedScore: {
    fontSize: 28,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subScoreValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  tipsContainer: {
    gap: 16,
  },
  tipCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    color: '#FFFFFF',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  tipEmoji: {
    fontSize: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 32,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 20,
    marginBottom: 12,
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  foodEmoji: {
    fontSize: 28,
  },
  bottomSpacing: {
    height: 32,
  },
});