import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Settings, 
  LogOut, 
  Edit, 
  Save, 
  X, 
  Mail,
  Crown,
  Star,
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Zap
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface UserStats {
  totalMeals: number;
  totalWorkouts: number;
  avgFitnessScore: number;
  avgEcoScore: number;
  currentStreak: number;
  totalCO2Saved: number;
  totalWaterSaved: number;
  rank: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/auth');
      return;
    }
    fetchProfile(user);
    fetchUserStats(user.id);
    fetchAchievements(user.id);
    checkSubscription(user.id);
  };

  const fetchProfile = async (user: any) => {
    try {
      // Try to get user profile from database
      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // User doesn't exist in users table, create it
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          Alert.alert('Error', 'Failed to create user profile');
        } else {
          setProfile(newProfile);
          setEditedName(newProfile.name);
        }
      } else if (!error) {
        setProfile(profileData);
        setEditedName(profileData.name);
      } else {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      // Fetch user statistics
      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId);

      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId);

      const { data: scores } = await supabase
        .from('daily_scores')
        .select('*')
        .eq('user_id', userId);

      // Calculate stats
      const totalMeals = meals?.length || 0;
      const totalWorkouts = workouts?.length || 0;
      const avgFitnessScore = scores?.length ? 
        scores.reduce((sum, score) => sum + (score.fitness_score || 0), 0) / scores.length : 0;
      const avgEcoScore = scores?.length ? 
        scores.reduce((sum, score) => sum + (score.eco_score || 0), 0) / scores.length : 0;
      
      // Mock additional stats
      const currentStreak = 7; // Days of consecutive logging
      const totalCO2Saved = meals?.reduce((sum, meal) => sum + (meal.carbon_impact || 0), 0) || 0;
      const totalWaterSaved = meals?.reduce((sum, meal) => sum + (meal.water_impact || 0), 0) || 0;
      const rank = 42; // Mock leaderboard rank

      setUserStats({
        totalMeals,
        totalWorkouts,
        avgFitnessScore: Math.round(avgFitnessScore),
        avgEcoScore: Math.round(avgEcoScore),
        currentStreak,
        totalCO2Saved,
        totalWaterSaved,
        rank,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchAchievements = async (userId: string) => {
    // Mock achievements data - in production, fetch from database
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        name: 'First Steps',
        description: 'Log your first meal',
        icon: 'target',
        earned: true,
        earnedDate: '2024-01-01',
      },
      {
        id: '2',
        name: 'Eco Warrior',
        description: 'Save 10kg of CO₂',
        icon: 'leaf',
        earned: true,
        earnedDate: '2024-01-05',
      },
      {
        id: '3',
        name: 'Fitness Enthusiast',
        description: 'Complete 20 workouts',
        icon: 'zap',
        earned: false,
      },
      {
        id: '4',
        name: 'Streak Master',
        description: 'Log meals for 30 consecutive days',
        icon: 'calendar',
        earned: false,
      },
      {
        id: '5',
        name: 'Top Performer',
        description: 'Reach top 10 on leaderboard',
        icon: 'trophy',
        earned: false,
      },
    ];

    setAchievements(mockAchievements);
  };

  const checkSubscription = async (userId: string) => {
    // Mock subscription check - in production, integrate with RevenueCat
    setIsPro(false); // Default to free tier
  };

  const handleSaveProfile = async () => {
    if (!profile || !editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ name: editedName.trim() })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile');
      } else {
        setProfile(data);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgrade = () => {
    Alert.alert(
      'Upgrade to Pro',
      'Get unlimited recipe generation, advanced analytics, and exclusive eco rewards!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => {
          // In production, integrate with RevenueCat
          Alert.alert('Coming Soon', 'Pro features will be available soon!');
        }},
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              router.replace('/auth');
            }
          }
        },
      ]
    );
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <View style={styles.statCard}>
      <Icon size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const AchievementBadge = ({ achievement }: { achievement: Achievement }) => (
    <View style={[styles.achievementBadge, !achievement.earned && styles.lockedBadge]}>
      {achievement.icon === 'target' && <Target size={20} color={achievement.earned ? '#F59E0B' : '#9CA3AF'} />}
      {achievement.icon === 'leaf' && <Star size={20} color={achievement.earned ? '#16A34A' : '#9CA3AF'} />}
      {achievement.icon === 'zap' && <Zap size={20} color={achievement.earned ? '#2563EB' : '#9CA3AF'} />}
      {achievement.icon === 'calendar' && <Calendar size={20} color={achievement.earned ? '#7C3AED' : '#9CA3AF'} />}
      {achievement.icon === 'trophy' && <Trophy size={20} color={achievement.earned ? '#F59E0B' : '#9CA3AF'} />}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <LinearGradient
          colors={['#7C3AED', '#A855F7']}
          style={styles.header}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <User size={48} color="#FFFFFF" />
              {isPro && (
                <View style={styles.proIndicator}>
                  <Crown size={16} color="#F59E0B" />
                </View>
              )}
            </View>
            
            {isEditing ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter your name"
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsEditing(false);
                      setEditedName(profile?.name || '');
                    }}
                  >
                    <X size={16} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveProfile}
                    disabled={isSaving}
                  >
                    <Save size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile?.name}</Text>
                <Text style={styles.profileEmail}>{profile?.email}</Text>
                {userStats && (
                  <Text style={styles.profileRank}>Rank #{userStats.rank} • {userStats.currentStreak} day streak</Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Edit size={16} color="#FFFFFF" />
              <Text style={styles.editProfileText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        {userStats && (
          <View style={styles.section}>
            <View style={styles.quickStats}>
              <StatCard
                title="Meals"
                value={userStats.totalMeals}
                subtitle="logged"
                icon={Target}
                color="#16A34A"
              />
              <StatCard
                title="Workouts"
                value={userStats.totalWorkouts}
                subtitle="completed"
                icon={Zap}
                color="#2563EB"
              />
              <StatCard
                title="Eco Score"
                value={userStats.avgEcoScore}
                subtitle="average"
                icon={Star}
                color="#059669"
              />
            </View>
          </View>
        )}

        {/* Achievements Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity onPress={() => setShowAchievementsModal(true)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.achievementsPreview}>
            {achievements.slice(0, 5).map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>

        {/* Pro Upgrade */}
        {!isPro && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.proCard} onPress={handleUpgrade}>
              <LinearGradient
                colors={['#F59E0B', '#F97316']}
                style={styles.proGradient}
              >
                <Crown size={24} color="#FFFFFF" />
                <Text style={styles.proTitle}>Upgrade to Pro</Text>
                <Text style={styles.proSubtitle}>
                  Unlock unlimited recipes, advanced analytics, and exclusive rewards
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Options */}
        <View style={styles.section}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowStatsModal(true)}>
              <TrendingUp size={20} color="#6B7280" />
              <Text style={styles.menuText}>Detailed Statistics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Settings size={20} color="#6B7280" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <LogOut size={20} color="#EF4444" />
              <Text style={[styles.menuText, { color: '#EF4444' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Stats Modal */}
      <Modal
        visible={showStatsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detailed Statistics</Text>
            <TouchableOpacity onPress={() => setShowStatsModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {userStats && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Meals"
                  value={userStats.totalMeals}
                  icon={Target}
                  color="#16A34A"
                />
                <StatCard
                  title="Total Workouts"
                  value={userStats.totalWorkouts}
                  icon={Zap}
                  color="#2563EB"
                />
                <StatCard
                  title="Avg Fitness Score"
                  value={userStats.avgFitnessScore}
                  icon={TrendingUp}
                  color="#F59E0B"
                />
                <StatCard
                  title="Avg Eco Score"
                  value={userStats.avgEcoScore}
                  icon={Star}
                  color="#059669"
                />
                <StatCard
                  title="CO₂ Impact"
                  value={`${userStats.totalCO2Saved.toFixed(1)}kg`}
                  icon={Star}
                  color="#16A34A"
                />
                <StatCard
                  title="Water Impact"
                  value={`${userStats.totalWaterSaved.toFixed(0)}L`}
                  icon={Star}
                  color="#06B6D4"
                />
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Achievements Modal */}
      <Modal
        visible={showAchievementsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAchievementsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Achievements</Text>
            <TouchableOpacity onPress={() => setShowAchievementsModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.achievementsList}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <AchievementBadge achievement={achievement} />
                  <View style={styles.achievementInfo}>
                    <Text style={[styles.achievementName, !achievement.earned && styles.lockedText]}>
                      {achievement.name}
                    </Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                    {achievement.earned && achievement.earnedDate && (
                      <Text style={styles.earnedDate}>
                        Earned on {new Date(achievement.earnedDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  proIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#E9D5FF',
    marginBottom: 4,
  },
  profileRank: {
    fontSize: 14,
    color: '#C4B5FD',
  },
  editNameContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    minWidth: 200,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 6,
  },
  saveButton: {
    padding: 8,
    backgroundColor: '#16A34A',
    borderRadius: 6,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  achievementsPreview: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  lockedBadge: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  proCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  proGradient: {
    padding: 20,
    alignItems: 'center',
  },
  proTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  proSubtitle: {
    fontSize: 14,
    color: '#FEF3C7',
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#111827',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementsList: {
    gap: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  lockedText: {
    color: '#9CA3AF',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  earnedDate: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
  },
});