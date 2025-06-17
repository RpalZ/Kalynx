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
import { User, Settings, LogOut, CreditCard as Edit, Save, X, Mail, Crown, Star, Trophy, Target, Calendar, TrendingUp, Zap } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme, isDark, toggleTheme } = useTheme();
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [units, setUnits] = useState('metric');
  const [language, setLanguage] = useState('en');

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

      // Fetch today's summary to get saved totals
      const today = new Date().toISOString().split('T')[0];
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('No session found for fetching daily summary');
        return;
      }
      const summaryResponse = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-daily-summary?date=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
          },
        }
      );
      let summaryData = { totalCarbonSaved: 0, totalWaterSaved: 0 };
      if (summaryResponse.ok) {
        summaryData = await summaryResponse.json();
      } else {
        console.error('Failed to fetch daily summary for profile stats:', await summaryResponse.text());
      }

      // Calculate stats
      const totalMeals = meals?.length || 0;
      const totalWorkouts = workouts?.length || 0;
      const avgFitnessScore = scores?.length ? 
        scores.reduce((sum, score) => sum + (score.fitness_score || 0), 0) / scores.length : 0;
      const avgEcoScore = scores?.length ? 
        scores.reduce((sum, score) => sum + (score.eco_score || 0), 0) / scores.length : 0;
      
      // Mock additional stats
      const currentStreak = 7; // Days of consecutive logging
      const rank = 42; // Mock leaderboard rank

      setUserStats({
        totalMeals,
        totalWorkouts,
        avgFitnessScore: Math.round(avgFitnessScore),
        avgEcoScore: Math.round(avgEcoScore),
        currentStreak,
        totalCO2Saved: summaryData.totalCarbonSaved,
        totalWaterSaved: summaryData.totalWaterSaved,
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
    console.log('Sign out button pressed');
    try {
      // First clear the local state
      setProfile(null);
      setUserStats(null);
      setAchievements([]);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      console.log('Sign out response:', error ? 'Error' : 'Success');
      
      if (error) {
        console.error('Sign out error:', error);
        return;
      }
      
      console.log('Sign out successful, navigating to auth screen...');
      
      // Try multiple navigation approaches
      try {
        router.replace('/auth');
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Fallback navigation
        router.push('/auth');
      }
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Icon size={24} color={color} />
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: theme.colors.placeholder }]}>{subtitle}</Text>}
    </View>
  );

  const AchievementBadge = ({ achievement }: { achievement: Achievement }) => (
    <View style={[styles.achievementBadge, !achievement.earned && styles.lockedBadge, { backgroundColor: theme.colors.card, borderColor: achievement.earned ? theme.colors.border : theme.colors.disabled }]}>
      {achievement.icon === 'target' && <Target size={20} color={achievement.earned ? theme.colors.warning : theme.colors.disabled} />}
      {achievement.icon === 'leaf' && <Star size={20} color={achievement.earned ? theme.colors.success : theme.colors.disabled} />}
      {achievement.icon === 'zap' && <Zap size={20} color={achievement.earned ? theme.colors.secondary : theme.colors.disabled} />}
      {achievement.icon === 'calendar' && <Calendar size={20} color={achievement.earned ? theme.colors.accent : theme.colors.disabled} />}
      {achievement.icon === 'trophy' && <Trophy size={20} color={achievement.earned ? theme.colors.warning : theme.colors.disabled} />}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <LinearGradient
          colors={theme.colors.gradient.primary}
          style={styles.header}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <User size={48} color="#FFFFFF" />
              {isPro && (
                <View style={styles.proIndicator}>
                  <Crown size={16} color={theme.colors.warning} />
                </View>
              )}
            </View>
            
            {isEditing ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={[styles.nameInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.placeholder}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: '#FFFFFF' }]}
                    onPress={() => {
                      setIsEditing(false);
                      setEditedName(profile?.name || '');
                    }}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.colors.success }]}
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
                color={theme.colors.success}
              />
              <StatCard
                title="Workouts"
                value={userStats.totalWorkouts}
                subtitle="completed"
                icon={Zap}
                color={theme.colors.secondary}
              />
              <StatCard
                title="Eco Score"
                value={userStats.avgEcoScore}
                subtitle="average"
                icon={Star}
                color={theme.colors.success}
              />
            </View>
          </View>
        )}

        {/* Achievements Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Achievements</Text>
            <TouchableOpacity onPress={() => setShowAchievementsModal(true)}>
              <Text style={[styles.viewAllText, { color: theme.colors.accent }]}>View All</Text>
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
                colors={theme.colors.gradient.warning}
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
          <View style={[styles.menuContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} onPress={() => setShowStatsModal(true)}>
              <TrendingUp size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Detailed Statistics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} onPress={() => setShowSettingsModal(true)}>
              <Settings size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <LogOut size={20} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error }]}>Sign Out</Text>
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
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Detailed Statistics</Text>
            <TouchableOpacity onPress={() => setShowStatsModal(false)}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {userStats && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Meals"
                  value={userStats.totalMeals}
                  icon={Target}
                  color={theme.colors.success}
                />
                <StatCard
                  title="Total Workouts"
                  value={userStats.totalWorkouts}
                  icon={Zap}
                  color={theme.colors.secondary}
                />
                <StatCard
                  title="Avg Fitness Score"
                  value={userStats.avgFitnessScore}
                  icon={TrendingUp}
                  color={theme.colors.warning}
                />
                <StatCard
                  title="Avg Eco Score"
                  value={userStats.avgEcoScore}
                  icon={Star}
                  color={theme.colors.success}
                />
                <StatCard
                  title="CO₂ Impact"
                  value={`${userStats.totalCO2Saved.toFixed(1)}kg`}
                  icon={Star}
                  color={theme.colors.success}
                />
                <StatCard
                  title="Water Impact"
                  value={`${userStats.totalWaterSaved.toFixed(0)}L`}
                  icon={Star}
                  color={theme.colors.info}
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
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Achievements</Text>
            <TouchableOpacity onPress={() => setShowAchievementsModal(false)}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.achievementsList}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={[styles.achievementItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <AchievementBadge achievement={achievement} />
                  <View style={styles.achievementInfo}>
                    <Text style={[styles.achievementName, !achievement.earned && styles.lockedText, { color: achievement.earned ? theme.colors.text : theme.colors.disabled }]}>
                      {achievement.name}
                    </Text>
                    <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>
                      {achievement.description}
                    </Text>
                    {achievement.earned && achievement.earnedDate && (
                      <Text style={[styles.earnedDate, { color: theme.colors.success }]}>
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

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: theme.colors.text }]}>Preferences</Text>
              
              <View style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Notifications</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Receive updates about your progress and achievements</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, notificationsEnabled && styles.toggleActive, { backgroundColor: notificationsEnabled ? theme.colors.primary : theme.colors.border }]}
                  onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                >
                  <View style={[styles.toggleKnob, notificationsEnabled && styles.toggleKnobActive]} />
                </TouchableOpacity>
              </View>

              <View style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Dark Mode</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Switch between light and dark theme</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, isDark && styles.toggleActive, { backgroundColor: isDark ? theme.colors.primary : theme.colors.border }]}
                  onPress={toggleTheme}
                >
                  <View style={[styles.toggleKnob, isDark && styles.toggleKnobActive]} />
                </TouchableOpacity>
              </View>

              <View style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Units</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Choose your preferred measurement system</Text>
                </View>
                <View style={styles.unitSelector}>
                  <TouchableOpacity
                    style={[styles.unitButton, units === 'metric' && styles.unitButtonActive, { backgroundColor: units === 'metric' ? theme.colors.accent : theme.colors.surface }]}
                    onPress={() => setUnits('metric')}
                  >
                    <Text style={[styles.unitButtonText, units === 'metric' && styles.unitButtonTextActive, { color: units === 'metric' ? '#FFFFFF' : theme.colors.textSecondary }]}>
                      Metric
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitButton, units === 'imperial' && styles.unitButtonActive, { backgroundColor: units === 'imperial' ? theme.colors.accent : theme.colors.surface }]}
                    onPress={() => setUnits('imperial')}
                  >
                    <Text style={[styles.unitButtonText, units === 'imperial' && styles.unitButtonTextActive, { color: units === 'imperial' ? '#FFFFFF' : theme.colors.textSecondary }]}>
                      Imperial
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Language</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Select your preferred language</Text>
                </View>
                <View style={styles.languageSelector}>
                  <TouchableOpacity
                    style={[styles.languageButton, language === 'en' && styles.languageButtonActive, { backgroundColor: language === 'en' ? theme.colors.accent : theme.colors.surface }]}
                    onPress={() => setLanguage('en')}
                  >
                    <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive, { color: language === 'en' ? '#FFFFFF' : theme.colors.textSecondary }]}>
                      English
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.languageButton, language === 'es' && styles.languageButtonActive, { backgroundColor: language === 'es' ? theme.colors.accent : theme.colors.surface }]}
                    onPress={() => setLanguage('es')}
                  >
                    <Text style={[styles.languageButtonText, language === 'es' && styles.languageButtonTextActive, { color: language === 'es' ? '#FFFFFF' : theme.colors.textSecondary }]}>
                      Español
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: theme.colors.text }]}>Account</Text>
              
              <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Privacy Policy</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Read our privacy policy</Text>
                </View>
                <Text style={[styles.settingArrow, { color: theme.colors.textSecondary }]}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Terms of Service</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Read our terms of service</Text>
                </View>
                <Text style={[styles.settingArrow, { color: theme.colors.textSecondary }]}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Delete Account</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.error }]}>
                    Permanently delete your account and all data
                  </Text>
                </View>
                <Text style={[styles.settingArrow, { color: theme.colors.error }]}>›</Text>
              </TouchableOpacity>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
    borderRadius: 6,
  },
  saveButton: {
    padding: 8,
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
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 12,
  },
  achievementsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  achievementBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    flexBasis: 'auto',
  },
  lockedBadge: {
    backgroundColor: '#F3F4F6',
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
    borderRadius: 12,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lockedText: {
    color: '#9CA3AF',
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  earnedDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  settingArrow: {
    fontSize: 24,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#7C3AED',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: '#7C3AED',
  },
  unitButtonText: {
    fontSize: 14,
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  languageSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  languageButtonActive: {
    backgroundColor: '#7C3AED',
  },
  languageButtonText: {
    fontSize: 14,
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
});