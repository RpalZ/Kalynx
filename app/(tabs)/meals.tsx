import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, Utensils, Flame, Activity, Leaf, Droplet, X, ChefHat, Clock, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';

const { width } = Dimensions.get('window');

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbon_impact: number;
  water_impact: number;
  created_at: string;
}

interface DetailedIngredient {
  ingredient: string;
  amount: string;
  unit: string;
}

export default function MealsScreen() {
  const { theme, isDark } = useTheme();
  const { isDesktop, isTablet, getSpacing } = useResponsive();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailedIngredients, setDetailedIngredients] = useState<DetailedIngredient[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currentUnit, setCurrentUnit] = useState('g');

  useEffect(() => {
    checkAuth();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchMeals();
    }, [])
  );

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/auth');
      return;
    }
    fetchMeals();
  };

  const fetchMeals = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      const { data: mealsData, error } = await supabase
        .from('meals')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching meals:', error);
        Alert.alert('Error', 'Failed to load meals');
      } else {
        setMeals(mealsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load meals');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeals();
  };

  const handleAddIngredient = () => {
    if (!currentIngredient.trim()) {
      Alert.alert('Error', 'Please enter an ingredient name');
      return;
    }
    
    if (!currentAmount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    if (!currentUnit.trim()) {
      Alert.alert('Error', 'Please enter a unit (g/ml)');
      return;
    }
    
    setDetailedIngredients([
      ...detailedIngredients,
      {
        ingredient: currentIngredient.trim(),
        amount: currentAmount.trim(),
        unit: currentUnit.trim(),
      }
    ]);
    setCurrentIngredient('');
    setCurrentAmount('');
    setCurrentUnit('g');
  };

  const handleRemoveIngredient = (index: number) => {
    setDetailedIngredients(detailedIngredients.filter((_, i) => i !== index));
  };

  const handleAddMeal = async () => {
    if (!newMealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      const token = session.session.access_token;
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/log-meal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mealName: newMealName,
            detailed_ingredients: detailedIngredients.length > 0 ? detailedIngredients : undefined,
          }),
        }
      );

      if (response.ok) {
        setNewMealName('');
        setDetailedIngredients([]);
        setShowAddForm(false);
        fetchMeals();
        Alert.alert('Success', 'Meal logged successfully!');
      } else {
        const errorData = await response.text();
        Alert.alert('Error', errorData || 'Failed to log meal');
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Error', 'Failed to log meal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMeals = meals.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const MealCard = ({ meal }: { meal: Meal }) => (
    <View style={[
      styles.mealCard, 
      { 
        backgroundColor: theme.colors.card, 
        borderColor: theme.colors.border,
        minHeight: isDesktop ? 180 : 160,
      }
    ]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
        style={styles.mealCardGradient}
      >
        <View style={styles.mealHeader}>
          <View style={[styles.mealIcon, { backgroundColor: `${theme.colors.success}20` }]}>
            <Utensils size={isDesktop ? 24 : 20} color={theme.colors.success} />
          </View>
          <View style={styles.mealInfo}>
            <Text style={[styles.mealName, { color: theme.colors.text, fontSize: isDesktop ? 20 : 18 }]}>{meal.name}</Text>
            <View style={styles.mealTime}>
              <Clock size={isDesktop ? 14 : 12} color={theme.colors.placeholder} />
              <Text style={[styles.mealTimeText, { color: theme.colors.placeholder, fontSize: isDesktop ? 14 : 12 }]}>
                {new Date(meal.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.mealStats}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.error}20` }]}>
                <Flame size={isDesktop ? 16 : 14} color={theme.colors.error} />
              </View>
              <Text style={[styles.statText, { color: theme.colors.textSecondary, fontSize: isDesktop ? 15 : 14 }]}>{Math.round(meal.calories)} kcal</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                <Activity size={isDesktop ? 16 : 14} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.statText, { color: theme.colors.textSecondary, fontSize: isDesktop ? 15 : 14 }]}>{meal.protein.toFixed(1)}g protein</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                <Leaf size={isDesktop ? 16 : 14} color={theme.colors.success} />
              </View>
              <Text style={[styles.statText, { color: theme.colors.textSecondary, fontSize: isDesktop ? 15 : 14 }]}>{meal.carbon_impact.toFixed(2)} kg CO₂</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.info}20` }]}>
                <Droplet size={isDesktop ? 16 : 14} color={theme.colors.info} />
              </View>
              <Text style={[styles.statText, { color: theme.colors.textSecondary, fontSize: isDesktop ? 15 : 14 }]}>{meal.water_impact.toFixed(1)}L water</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ResponsiveContainer>
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingCard, { backgroundColor: theme.colors.card }]}>
              <ChefHat size={48} color={theme.colors.success} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading your meals...</Text>
            </View>
          </View>
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.gradient.success[0], theme.colors.gradient.success[1]]}
        style={[styles.header, { paddingBottom: isDesktop ? 48 : 32 }]}
      >
        <ResponsiveContainer>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { fontSize: isDesktop ? 36 : 28 }]}>Today's Meals</Text>
              <Text style={[styles.headerSubtitle, { fontSize: isDesktop ? 18 : 16 }]}>Track your nutrition and environmental impact</Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { width: isDesktop ? 56 : 48, height: isDesktop ? 56 : 48 }]}
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={isDesktop ? 28 : 24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Hero Image */}
          <View style={[styles.heroImageContainer, { height: isDesktop ? 140 : 100 }]}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.heroImage}
            />
          </View>
        </ResponsiveContainer>
      </LinearGradient>

      <ResponsiveContainer>
        {/* Add Form */}
        {showAddForm && (
          <View style={[styles.addForm, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
            <LinearGradient
              colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
              style={[styles.addFormGradient, { padding: getSpacing(20, 24, 32) }]}
            >
              <View style={styles.formHeader}>
                <Sparkles size={isDesktop ? 24 : 20} color={theme.colors.accent} />
                <Text style={[styles.formTitle, { color: theme.colors.text, fontSize: isDesktop ? 22 : 18 }]}>Add New Meal</Text>
              </View>
              
              <TextInput
                style={[styles.input, { 
                  borderColor: theme.colors.border, 
                  color: theme.colors.text, 
                  backgroundColor: theme.colors.surface,
                  fontSize: isDesktop ? 18 : 16,
                  padding: isDesktop ? 20 : 16,
                }]}
                placeholder="Enter meal name (e.g., Grilled Chicken Salad)"
                placeholderTextColor={theme.colors.placeholder}
                value={newMealName}
                onChangeText={setNewMealName}
              />
              
              <View style={styles.ingredientsSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: isDesktop ? 18 : 16 }]}>Add Ingredients (Optional)</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary, fontSize: isDesktop ? 16 : 14 }]}>
                  Add each ingredient with its amount and unit for better accuracy
                </Text>

                <View style={[styles.ingredientInputContainer, { gap: isDesktop ? 16 : 8 }]}>
                  <View style={[styles.ingredientInputRow, { gap: isDesktop ? 12 : 8 }]}>
                    <TextInput
                      style={[styles.input, styles.ingredientInput, { 
                        borderColor: theme.colors.border, 
                        color: theme.colors.text, 
                        backgroundColor: theme.colors.surface,
                        fontSize: isDesktop ? 16 : 14,
                        padding: isDesktop ? 16 : 12,
                      }]}
                      placeholder="Ingredient"
                      placeholderTextColor={theme.colors.placeholder}
                      value={currentIngredient}
                      onChangeText={setCurrentIngredient}
                    />
                    <TextInput
                      style={[styles.input, styles.amountInput, { 
                        borderColor: theme.colors.border, 
                        color: theme.colors.text, 
                        backgroundColor: theme.colors.surface,
                        fontSize: isDesktop ? 16 : 14,
                        padding: isDesktop ? 16 : 12,
                      }]}
                      placeholder="Amount"
                      placeholderTextColor={theme.colors.placeholder}
                      value={currentAmount}
                      onChangeText={setCurrentAmount}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.input, styles.unitInput, { 
                        borderColor: theme.colors.border, 
                        color: theme.colors.text, 
                        backgroundColor: theme.colors.surface,
                        fontSize: isDesktop ? 16 : 14,
                        padding: isDesktop ? 16 : 12,
                      }]}
                      placeholder="Unit"
                      placeholderTextColor={theme.colors.placeholder}
                      value={currentUnit}
                      onChangeText={setCurrentUnit}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.addIngredientButton, { 
                      backgroundColor: theme.colors.success,
                      width: isDesktop ? 56 : 48,
                      height: isDesktop ? 56 : 48,
                    }]}
                    onPress={handleAddIngredient}
                  >
                    <Plus size={isDesktop ? 24 : 20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {detailedIngredients.length > 0 && (
                  <View style={styles.ingredientsList}>
                    <Text style={[styles.ingredientsListTitle, { color: theme.colors.text, fontSize: isDesktop ? 16 : 14 }]}>
                      Added Ingredients ({detailedIngredients.length})
                    </Text>
                    {detailedIngredients.map((ing, index) => (
                      <View key={index} style={[styles.ingredientItem, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.ingredientText, { color: theme.colors.text, fontSize: isDesktop ? 16 : 14 }]}>
                          {ing.ingredient} ({ing.amount}{ing.unit})
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveIngredient(index)}
                          style={styles.removeIngredientButton}
                        >
                          <X size={isDesktop ? 20 : 16} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={[styles.formButtons, { gap: isDesktop ? 16 : 12 }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.colors.border, padding: isDesktop ? 20 : 16 }]}
                  onPress={() => {
                    setShowAddForm(false);
                    setNewMealName('');
                    setDetailedIngredients([]);
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary, fontSize: isDesktop ? 18 : 16 }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: theme.colors.success, padding: isDesktop ? 20 : 16 }]}
                  onPress={handleAddMeal}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.submitButtonText, { fontSize: isDesktop ? 18 : 16 }]}>
                    {isSubmitting ? 'Adding...' : 'Add Meal'}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Search */}
        <View style={[styles.searchContainer, { 
          backgroundColor: theme.colors.card, 
          borderColor: theme.colors.border,
          margin: getSpacing(20, 24, 32),
          padding: isDesktop ? 20 : 16,
        }]}>
          <View style={[styles.searchIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
            <Search size={isDesktop ? 24 : 20} color={theme.colors.secondary} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text, fontSize: isDesktop ? 18 : 16 }]}
            placeholder="Search meals..."
            placeholderTextColor={theme.colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Meals List */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredMeals.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                <Utensils size={isDesktop ? 64 : 48} color={theme.colors.success} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text, fontSize: isDesktop ? 28 : 20 }]}>No meals logged yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary, fontSize: isDesktop ? 18 : 16 }]}>
                {searchQuery ? 'No meals match your search' : 'Start tracking your meals to see your nutrition and environmental impact'}
              </Text>
            </View>
          ) : (
            <View style={[styles.mealsContainer, { padding: getSpacing(20, 24, 32) }]}>
              <ResponsiveGrid
                columns={{ mobile: 1, tablet: 2, desktop: 2, largeDesktop: 3 }}
                gap={getSpacing(16, 20, 24)}
              >
                {filteredMeals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </ResponsiveGrid>
            </View>
          )}
          <View style={[styles.bottomSpacing, { height: getSpacing(32, 40, 48) }]} />
        </ScrollView>
      </ResponsiveContainer>
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
    paddingHorizontal: 0,
    paddingTop: 20,
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
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#D1FAE5',
  },
  addButton: {
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    opacity: 0.8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  addForm: {
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  addFormGradient: {
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  formTitle: {
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    fontWeight: '500',
  },
  ingredientsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    marginBottom: 16,
  },
  ingredientInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ingredientInputRow: {
    flex: 1,
    flexDirection: 'row',
  },
  ingredientInput: {
    flex: 2,
  },
  amountInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  addIngredientButton: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientsListTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  ingredientText: {
    fontWeight: '500',
  },
  removeIngredientButton: {
    padding: 4,
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  mealsContainer: {
  },
  mealCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  mealCardGradient: {
    padding: 20,
    flex: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  mealTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealTimeText: {
    fontWeight: '500',
  },
  mealStats: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    fontWeight: '600',
    flex: 1,
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
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
  },
});