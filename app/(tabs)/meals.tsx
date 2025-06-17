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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Utensils, Flame, Activity, Leaf, Droplet, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';

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
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Utensils size={20} color="#16A34A" />
        <Text style={styles.mealName}>{meal.name}</Text>
      </View>
      <View style={styles.mealStats}>
        <View style={styles.statItem}>
          <Flame size={16} color="#EF4444" />
          <Text style={styles.statText}>{Math.round(meal.calories)} kcal</Text>
        </View>
        <View style={styles.statItem}>
          <Activity size={16} color="#2563EB" />
          <Text style={styles.statText}>{meal.protein.toFixed(1)}g protein</Text>
        </View>
        <View style={styles.statItem}>
          <Leaf size={16} color="#16A34A" />
          <Text style={styles.statText}>{meal.carbon_impact.toFixed(2)} kg CO₂</Text>
        </View>
        <View style={styles.statItem}>
          <Droplet size={16} color="#06B6D4" />
          <Text style={styles.statText}>{meal.water_impact.toFixed(1)}L water</Text>
        </View>
      </View>
      <Text style={styles.mealTime}>
        {new Date(meal.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading meals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Meals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Enter meal name"
            value={newMealName}
            onChangeText={setNewMealName}
          />
          
          <View style={styles.ingredientsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Add Ingredients (Optional)</Text>
              <Text style={styles.sectionSubtitle}>
                Add each ingredient with its amount and unit
              </Text>
            </View>

            <View style={styles.ingredientInputContainer}>
              <View style={styles.ingredientInputRow}>
                <TextInput
                  style={[styles.input, styles.ingredientInput]}
                  placeholder="Ingredient (e.g., chicken)"
                  value={currentIngredient}
                  onChangeText={setCurrentIngredient}
                  onSubmitEditing={() => {
                    if (currentIngredient.trim()) {
                      setCurrentAmount('');
                      setCurrentUnit('g');
                    }
                  }}
                />
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="Amount"
                  value={currentAmount}
                  onChangeText={setCurrentAmount}
                  keyboardType="numeric"
                  onSubmitEditing={() => {
                    if (currentAmount.trim()) {
                      setCurrentUnit('g');
                    }
                  }}
                />
                <TextInput
                  style={[styles.input, styles.unitInput]}
                  placeholder="Unit (g/ml)"
                  value={currentUnit}
                  onChangeText={setCurrentUnit}
                  onSubmitEditing={handleAddIngredient}
                />
              </View>
              <TouchableOpacity
                style={styles.addIngredientButton}
                onPress={handleAddIngredient}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {detailedIngredients.length > 0 && (
              <View style={styles.ingredientsList}>
                <Text style={styles.ingredientsListTitle}>
                  Added Ingredients ({detailedIngredients.length})
                </Text>
                {detailedIngredients.map((ing, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientText}>
                      {ing.ingredient} ({ing.amount}{ing.unit})
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveIngredient(index)}
                      style={styles.removeIngredientButton}
                    >
                      <X size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddForm(false);
                setNewMealName('');
                setDetailedIngredients([]);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddMeal}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Adding...' : 'Add Meal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search meals..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Utensils size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No meals logged yet</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'No meals match your search' : 'Start tracking your meals to see your nutrition and environmental impact'}
            </Text>
          </View>
        ) : (
          <View style={styles.mealsContainer}>
            {filteredMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#16A34A',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#16A34A',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  mealsContainer: {
    padding: 16,
    gap: 12,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  mealStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: '48%',
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    flexWrap: 'wrap',
  },
  mealTime: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  ingredientsSection: {
    marginTop: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  ingredientInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  ingredientInputRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  ingredientInput: {
    flex: 2,
    minWidth: 100,
  },
  amountInput: {
    flex: 1,
    minWidth: 60,
  },
  unitInput: {
    flex: 1,
    minWidth: 60,
  },
  addIngredientButton: {
    backgroundColor: '#16A34A',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  ingredientsList: {
    marginTop: 12,
    gap: 8,
  },
  ingredientsListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
  },
  ingredientText: {
    fontSize: 14,
    color: '#111827',
  },
  removeIngredientButton: {
    padding: 4,
  },
});