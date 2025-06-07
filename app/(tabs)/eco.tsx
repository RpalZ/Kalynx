import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, Droplet, TreePine, Recycle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

interface EcoStats {
  totalCO2e: number;
  totalWater: number;
  mealsCount: number;
  avgCO2PerMeal: number;
  avgWaterPerMeal: number;
}

export default function EcoScreen() {
  const [ecoStats, setEcoStats] = useState<EcoStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<EcoStats | null>(null);
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
    fetchEcoData();
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchEcoData();
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

  const ImpactCard = ({ title, today, weekly, unit, improvement }: any) => (
    <View style={styles.impactCard}>
      <Text style={styles.impactTitle}>{title}</Text>
      <View style={styles.impactStats}>
        <View style={styles.impactStat}>
          <Text style={styles.impactLabel}>Today</Text>
          <Text style={styles.impactValue}>{today} {unit}</Text>
        </View>
        <View style={styles.impactStat}>
          <Text style={styles.impactLabel}>7-Day Avg</Text>
          <Text style={styles.impactValue}>{weekly} {unit}</Text>
        </View>
      </View>
      {improvement && (
        <Text style={[styles.improvementText, { color: improvement > 0 ? '#EF4444' : '#16A34A' }]}>
          {improvement > 0 ? '↑' : '↓'} {Math.abs(improvement)}% from last week
        </Text>
      )}
    </View>
  );

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
        <Text style={styles.headerSubtitle}>Track your sustainable choices</Text>
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

        {/* Weekly Comparison */}
        {weeklyStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7-Day Overview</Text>
            <View style={styles.comparisonContainer}>
              <ImpactCard
                title="Carbon Impact"
                today={ecoStats?.totalCO2e.toFixed(2) || '0.00'}
                weekly={(weeklyStats.totalCO2e / 7).toFixed(2)}
                unit="kg CO₂e"
              />
              <ImpactCard
                title="Water Usage"
                today={ecoStats?.totalWater.toFixed(1) || '0.0'}
                weekly={(weeklyStats.totalWater / 7).toFixed(1)}
                unit="liters"
              />
            </View>
          </View>
        )}

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
  comparisonContainer: {
    gap: 12,
  },
  impactCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  impactStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  impactStat: {
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  impactValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  improvementText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  equivalentsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  equivalentCard: {
    flex: 1,
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
    marginBottom: 2,
  },
  equivalentSubtext: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
});