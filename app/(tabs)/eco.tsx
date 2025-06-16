import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Leaf, 
  Droplet, 
  TreePine, 
  Recycle, 
  Award,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Zap,
  Gift
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';

interface EcoStats {
  totalCO2e: number;
  totalWater: number;
  mealsCount: number;
  avgCO2PerMeal: number;
  avgWaterPerMeal: number;
  totalCarbonSaved: number;
  totalWaterSaved: number;
}

interface EcoMilestone {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  type: 'carbon_saved' | 'water_saved' | 'meals_logged' | 'streak_days';
  reward: string;
  completed: boolean;
  icon: string;
}

interface EcoChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  endDate: string;
  reward: string;
  type: 'weekly' | 'monthly';
}

export default function EcoScreen() {
  const [ecoStats, setEcoStats] = useState<EcoStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<EcoStats | null>(null);
  const [milestones, setMilestones] = useState<EcoMilestone[]>([]);
  const [challenges, setChallenges] = useState<EcoChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<EcoMilestone | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkAuth(); // Re-run auth check and data fetch on focus
    }, [])
  );

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/auth');
      return;
    }
    fetchEcoData();
    fetchMilestones();
    fetchChallenges();
  };

  const fetchEcoData = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      // Fetch today's data
      const today = new Date().toISOString().split('T')[0];
      const todayResponse = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-daily-summary?date=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        setEcoStats({
          totalCO2e: todayData.totalCO2e,
          totalWater: todayData.totalWater,
          mealsCount: todayData.mealsCount,
          avgCO2PerMeal: todayData.mealsCount > 0 ? todayData.totalCO2e / todayData.mealsCount : 0,
          avgWaterPerMeal: todayData.mealsCount > 0 ? todayData.totalWater / todayData.mealsCount : 0,
          totalCarbonSaved: todayData.totalCarbonSaved,
          totalWaterSaved: todayData.totalWaterSaved,
        });
      }

      // Fetch weekly data
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const { data: weeklyMeals, error } = await supabase
        .from('meals')
        .select('carbon_impact, water_impact')
        .gte('created_at', `${weekStartStr}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      if (!error && weeklyMeals) {
        const weeklyTotalCO2 = weeklyMeals.reduce((sum, meal) => sum + (meal.carbon_impact || 0), 0);
        const weeklyTotalWater = weeklyMeals.reduce((sum, meal) => sum + (meal.water_impact || 0), 0);
        
        setWeeklyStats({
          totalCO2e: weeklyTotalCO2,
          totalWater: weeklyTotalWater,
          mealsCount: weeklyMeals.length,
          avgCO2PerMeal: weeklyMeals.length > 0 ? weeklyTotalCO2 / weeklyMeals.length : 0,
          avgWaterPerMeal: weeklyMeals.length > 0 ? weeklyTotalWater / weeklyMeals.length : 0,
          totalCarbonSaved: weeklyTotalCO2,
          totalWaterSaved: weeklyTotalWater,
        });
      }

    } catch (error) {
      console.error('Error fetching eco data:', error);
      Alert.alert('Error', 'Failed to load environmental data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMilestones = async () => {
    // Mock milestones data - in production, fetch from database
    const mockMilestones: EcoMilestone[] = [
      {
        id: '1',
        name: 'Carbon Saver',
        description: 'Save 10kg of CO₂ through sustainable meal choices',
        target: 10,
        current: ecoStats?.totalCarbonSaved || 0,
        type: 'carbon_saved',
        reward: 'Eco Warrior Badge NFT',
        completed: (ecoStats?.totalCarbonSaved || 0) >= 10,
        icon: 'leaf',
      },
      {
        id: '2',
        name: 'Water Guardian',
        description: 'Save 100L of water through efficient meal planning',
        target: 100,
        current: ecoStats?.totalWaterSaved || 0,
        type: 'water_saved',
        reward: 'Water Protector Badge NFT',
        completed: (ecoStats?.totalWaterSaved || 0) >= 100,
        icon: 'droplet',
      },
      {
        id: '3',
        name: 'Meal Tracker',
        description: 'Log 50 sustainable meals',
        target: 50,
        current: ecoStats?.mealsCount || 0,
        type: 'meals_logged',
        reward: 'Nutrition Expert Badge NFT',
        completed: (ecoStats?.mealsCount || 0) >= 50,
        icon: 'target',
      },
    ];

    setMilestones(mockMilestones);
  };

  const fetchChallenges = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        router.replace('/auth');
        return;
      }
      const userId = session.session.user.id;

      const today = new Date();

      // Calculate Plant-Based Week progress
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const { data: weeklyMeals, error: weeklyMealsError } = await supabase
        .from('meals')
        .select('name')
        .eq('user_id', userId)
        .gte('created_at', startOfWeek.toISOString())
        .lt('created_at', endOfWeek.toISOString());
      
      let plantBasedMealsCount = 0;
      if (!weeklyMealsError && weeklyMeals) {
        const plantBasedKeywords = ['plant-based', 'vegan', 'vegetarian', 'tofu', 'lentil', 'bean', 'chickpea', 'vegetable'];
        plantBasedMealsCount = weeklyMeals.filter(meal => 
          plantBasedKeywords.some(keyword => meal.name.toLowerCase().includes(keyword))
        ).length;
      }

      // Calculate Low Carbon Month progress
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const { data: dailyScores, error: dailyScoresError } = await supabase
        .from('daily_scores')
        .select('date, eco_score')
        .eq('user_id', userId)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lt('date', endOfMonth.toISOString().split('T')[0]);

      let lowCarbonDaysCount = 0;
      if (!dailyScoresError && dailyScores) {
        // Count unique days where eco_score is greater than 50 (equivalent to totalCO2e < 2kg)
        const uniqueLowCarbonDays = new Set<string>();
        dailyScores.forEach(score => {
          if ((score.eco_score || 0) > 50) {
            uniqueLowCarbonDays.add(score.date);
          }
        });
        lowCarbonDaysCount = uniqueLowCarbonDays.size;
      }

      const updatedChallenges: EcoChallenge[] = [
        {
          id: '1',
          title: 'Plant-Based Week',
          description: 'Log 5 plant-based meals this week',
          target: 5,
          current: plantBasedMealsCount,
          endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + (7 - today.getDay())).toISOString().split('T')[0],
          reward: '50 Eco Points',
          type: 'weekly',
        },
        {
          id: '2',
          title: 'Low Carbon Month',
          description: 'Keep daily CO₂ under 2kg for 20 days this month',
          target: 20,
          current: lowCarbonDaysCount,
          endDate: endOfMonth.toISOString().split('T')[0],
          reward: 'Carbon Neutral Champion NFT',
          type: 'monthly',
        },
      ];

      setChallenges(updatedChallenges);

    } catch (error) {
      console.error('Error fetching challenges:', error);
      Alert.alert('Error', 'Failed to load challenges');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEcoData();
    fetchMilestones();
    fetchChallenges();
  };

  const claimReward = async (milestone: EcoMilestone) => {
    setSelectedReward(milestone);
    setShowRewardModal(true);
    
    // In production, mint NFT or award points here
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      // Mock NFT minting - replace with actual blockchain integration
      console.log(`Minting NFT for milestone: ${milestone.name}`);
      
      Alert.alert(
        'Reward Claimed!',
        `Congratulations! You've earned: ${milestone.reward}`,
        [{ text: 'Awesome!', onPress: () => setShowRewardModal(false) }]
      );
    } catch (error) {
      console.error('Error claiming reward:', error);
      Alert.alert('Error', 'Failed to claim reward');
    }
  };

  const EcoCard = ({ title, value, unit, icon: Icon, color, bgColor, subtitle }: any) => (
    <View style={[styles.ecoCard, { backgroundColor: bgColor }]}>
      <View style={styles.cardHeader}>
        <Icon size={24} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={styles.cardUnit}>{unit}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
    </View>
  );

  const MilestoneCard = ({ milestone }: { milestone: EcoMilestone }) => {
    const progress = (milestone.current / milestone.target) * 100;
    const isCompleted = progress >= 100;

    return (
      <View style={[styles.milestoneCard, isCompleted && styles.completedMilestone]}>
        <View style={styles.milestoneHeader}>
          <View style={styles.milestoneIcon}>
            {milestone.icon === 'leaf' && <Leaf size={20} color="#16A34A" />}
            {milestone.icon === 'droplet' && <Droplet size={20} color="#06B6D4" />}
            {milestone.icon === 'target' && <Target size={20} color="#F59E0B" />}
          </View>
          <View style={styles.milestoneInfo}>
            <Text style={styles.milestoneName}>{milestone.name}</Text>
            <Text style={styles.milestoneDescription}>{milestone.description}</Text>
          </View>
          {isCompleted && (
            <TouchableOpacity
              style={styles.claimButton}
              onPress={() => claimReward(milestone)}
            >
              <Gift size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(100, progress)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {milestone.current}/{milestone.target}
          </Text>
        </View>
        
        <Text style={styles.rewardText}>Reward: {milestone.reward}</Text>
      </View>
    );
  };

  const ChallengeCard = ({ challenge }: { challenge: EcoChallenge }) => {
    const progress = (challenge.current / challenge.target) * 100;
    const daysLeft = Math.ceil((new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <View style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <View style={styles.challengeIcon}>
            <Zap size={20} color="#7C3AED" />
          </View>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <Text style={styles.challengeDescription}>{challenge.description}</Text>
          </View>
          <View style={styles.challengeTime}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.timeLeft}>{daysLeft}d left</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.challengeProgressFill, 
                { width: `${Math.min(100, progress)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {challenge.current}/{challenge.target}
          </Text>
        </View>
        
        <Text style={styles.rewardText}>Reward: {challenge.reward}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading environmental data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#16A34A', '#22C55E']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Environmental Impact</Text>
        <Text style={styles.headerSubtitle}>Track your sustainable choices and earn rewards</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Today's Impact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Impact</Text>
          <View style={styles.cardsGrid}>
            <EcoCard
              title="Carbon Footprint"
              value={ecoStats?.totalCO2e.toFixed(2) || '0.00'}
              unit="kg CO₂e"
              icon={Leaf}
              color="#16A34A"
              bgColor="#F0FDF4"
              subtitle={`${ecoStats?.mealsCount || 0} meals logged`}
            />
            <EcoCard
              title="Water Usage"
              value={ecoStats?.totalWater.toFixed(1) || '0.0'}
              unit="liters"
              icon={Droplet}
              color="#06B6D4"
              bgColor="#ECFEFF"
              subtitle={`Avg ${ecoStats?.avgWaterPerMeal.toFixed(1) || '0.0'}L per meal`}
            />
          </View>
        </View>

        {/* Eco Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eco Milestones</Text>
          <View style={styles.milestonesContainer}>
            {milestones.map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))}
          </View>
        </View>

        {/* Active Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          <View style={styles.challengesContainer}>
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </View>
        </View>

        {/* Environmental Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sustainability Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <TreePine size={20} color="#16A34A" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Choose Plant-Based</Text>
                <Text style={styles.tipText}>
                  Plant-based meals typically have 50% lower carbon footprint than meat-based meals
                </Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <Recycle size={20} color="#059669" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Reduce Food Waste</Text>
                <Text style={styles.tipText}>
                  Plan your meals and use leftovers to minimize environmental impact
                </Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <Droplet size={20} color="#06B6D4" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Choose Local & Seasonal</Text>
                <Text style={styles.tipText}>
                  Local and seasonal foods require less water and transportation
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Impact Equivalents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Your Impact Means</Text>
          <View style={styles.equivalentsContainer}>
            <View style={styles.equivalentCard}>
              <Text style={styles.equivalentValue}>
                {((ecoStats?.totalCO2e || 0) * 365).toFixed(0)}
              </Text>
              <Text style={styles.equivalentLabel}>kg CO₂e per year</Text>
              <Text style={styles.equivalentSubtext}>at current daily rate</Text>
            </View>
            <View style={styles.equivalentCard}>
              <Text style={styles.equivalentValue}>
                {Math.round((ecoStats?.totalCO2e || 0) / 0.4)}
              </Text>
              <Text style={styles.equivalentLabel}>km driven</Text>
              <Text style={styles.equivalentSubtext}>car equivalent</Text>
            </View>
            <View style={styles.equivalentCard}>
              <Text style={styles.equivalentValue}>
                {Math.round((ecoStats?.totalWater || 0) / 8)}
              </Text>
              <Text style={styles.equivalentLabel}>showers</Text>
              <Text style={styles.equivalentSubtext}>water equivalent</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Reward Modal */}
      <Modal
        visible={showRewardModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRewardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Trophy size={48} color="#F59E0B" />
            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalText}>
              You've completed the "{selectedReward?.name}" milestone!
            </Text>
            <Text style={styles.modalReward}>
              Reward: {selectedReward?.reward}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowRewardModal(false)}
            >
              <Text style={styles.modalButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    color: '#D1FAE5',
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
  cardsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  ecoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardUnit: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  milestonesContainer: {
    gap: 12,
  },
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  completedMilestone: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  claimButton: {
    backgroundColor: '#16A34A',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  rewardText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  challengesContainer: {
    gap: 12,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  challengeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  challengeTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeLeft: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
  equivalentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-around',
  },
  equivalentCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  equivalentValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 4,
  },
  equivalentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  equivalentSubtext: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    margin: 20,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalReward: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});