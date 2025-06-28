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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, Utensils, Flame, Activity, Leaf, Droplet, X, ChefHat, Clock, Sparkles, Edit3, Trash2, Save, MoreVertical } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbon_impact: number;
  water_impact: number;
  created_at: string;
  detailed_ingredients?: { ingredient: string; amount: string; unit: string }[];
}

interface DetailedIngredient {
  ingredient: string;
  amount: string;
  unit: string;
}

interface EditMealModalProps {
  isVisible: boolean;
  meal: Meal | null;
  onClose: () => void;
  onSave: (updatedMeal: Meal) => void;
}

const EditMealModal = ({ isVisible, meal, onClose, onSave }: EditMealModalProps) => {
  const { theme, isDark } = useTheme();
  const [editedMeal, setEditedMeal] = useState<Meal | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (meal) {
      setEditedMeal({ ...meal });
    }
  }, [meal]);

  const handleSave = async () => {
    if (!editedMeal) return;

    // Validate inputs
    if (!editedMeal.name.trim()) {
      Alert.alert('Error', 'Meal name cannot be empty');
      return;
    }

    if (editedMeal.calories < 0 || editedMeal.protein < 0 || editedMeal.carbon_impact < 0 || editedMeal.water_impact < 0) {
      Alert.alert('Error', 'Values cannot be negative');
      return;
    }

    setIsSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('meals')
        .update({
          name: editedMeal.name.trim(),
          calories: Number(editedMeal.calories),
          protein: Number(editedMeal.protein),
          carbon_impact: Number(editedMeal.carbon_impact),
          water_impact: Number(editedMeal.water_impact),
        })
        .eq('id', editedMeal.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating meal:', error);
        Alert.alert('Error', 'Failed to update meal');
      } else {
        onSave(data);
        onClose();
        Alert.alert('Success', 'Meal updated successfully!');
      }
    } catch (error) {
      console.error('Error updating meal:', error);
      Alert.alert('Error', 'Failed to update meal');
    } finally {
      setIsSaving(false);
    }
  };

  if (!editedMeal) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <View style={styles.modalHeader}>
            <Edit3 size={24} color={theme.colors.secondary} />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Meal</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Meal Name</Text>
              <TextInput
                style={[styles.modalInput, { 
                  borderColor: theme.colors.border, 
                  color: theme.colors.text, 
                  backgroundColor: theme.colors.surface 
                }]}
                value={editedMeal.name}
                onChangeText={(text) => setEditedMeal({ ...editedMeal, name: text })}
                placeholder="Enter meal name"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Calories</Text>
                <TextInput
                  style={[styles.modalInput, { 
                    borderColor: theme.colors.border, 
                    color: theme.colors.text, 
                    backgroundColor: theme.colors.surface 
                  }]}
                  value={editedMeal.calories.toString()}
                  onChangeText={(text) => setEditedMeal({ ...editedMeal, calories: Number(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Protein (g)</Text>
                <TextInput
                  style={[styles.modalInput, { 
                    borderColor: theme.colors.border, 
                    color: theme.colors.text, 
                    backgroundColor: theme.colors.surface 
                  }]}
                  value={editedMeal.protein.toString()}
                  onChangeText={(text) => setEditedMeal({ ...editedMeal, protein: Number(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Carbon Impact (kg CO₂)</Text>
                <TextInput
                  style={[styles.modalInput, { 
                    borderColor: theme.colors.border, 
                    color: theme.colors.text, 
                    backgroundColor: theme.colors.surface 
                  }]}
                  value={editedMeal.carbon_impact.toString()}
                  onChangeText={(text) => setEditedMeal({ ...editedMeal, carbon_impact: Number(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Water Impact (L)</Text>
                <TextInput
                  style={[styles.modalInput, { 
                    borderColor: theme.colors.border, 
                    color: theme.colors.text, 
                    backgroundColor: theme.colors.surface 
                  }]}
                  value={editedMeal.water_impact.toString()}
                  onChangeText={(text) => setEditedMeal({ ...editedMeal, water_impact: Number(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.colors.surface }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.colors.secondary }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Save size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function MealsScreen() {
  const { theme, isDark } = useTheme();
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
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const handleDeleteMeal = async (mealId: string, mealName: string) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${mealName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('meals')
                .delete()
                .eq('id', mealId);

              if (error) {
                console.error('Error deleting meal:', error);
                Alert.alert('Error', 'Failed to delete meal');
              } else {
                setMeals(meals.filter(meal => meal.id !== mealId));
                Alert.alert('Success', 'Meal deleted successfully!');
              }
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal');
            }
          }
        }
      ]
    );
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setShowEditModal(true);
  };

  const handleSaveEditedMeal = (updatedMeal: Meal) => {
    setMeals(meals.map(meal => meal.id === updatedMeal.id ? updatedMeal : meal));
    setShowEditModal(false);
    setEditingMeal(null);
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

  const MealCard = ({ meal }: { meal: Meal }) => {
    const [showActions, setShowActions] = useState(false);

    return (
      <View style={[styles.mealCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
          style={styles.mealCardGradient}
        >
          <View style={styles.mealHeader}>
            <View style={[styles.mealIcon, { backgroundColor: `${theme.colors.success}20` }]}>
              <Utensils size={20} color={theme.colors.success} />
            </View>
            <View style={styles.mealInfo}>
              <Text style={[styles.mealName, { color: theme.colors.text }]}>{meal.name}</Text>
              <View style={styles.mealTime}>
                <Clock size={12} color={theme.colors.placeholder} />
                <Text style={[styles.mealTimeText, { color: theme.colors.placeholder }]}>
                  {new Date(meal.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.mealActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: `${theme.colors.textSecondary}10` }]}
                onPress={() => setShowActions(!showActions)}
              >
                <MoreVertical size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {showActions && (
            <View style={[styles.actionsMenu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => {
                  setShowActions(false);
                  handleEditMeal(meal);
                }}
              >
                <Edit3 size={16} color={theme.colors.secondary} />
                <Text style={[styles.actionMenuText, { color: theme.colors.text }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => {
                  setShowActions(false);
                  handleDeleteMeal(meal.id, meal.name);
                }}
              >
                <Trash2 size={16} color={theme.colors.error} />
                <Text style={[styles.actionMenuText, { color: theme.colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.mealStats}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${theme.colors.error}20` }]}>
                  <Flame size={14} color={theme.colors.error} />
                </View>
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{Math.round(meal.calories)} kcal</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                  <Activity size={14} color={theme.colors.secondary} />
                </View>
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{meal.protein.toFixed(1)}g protein</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                  <Leaf size={14} color={theme.colors.success} />
                </View>
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{meal.carbon_impact.toFixed(2)} kg CO₂</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${theme.colors.info}20` }]}>
                  <Droplet size={14} color={theme.colors.info} />
                </View>
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{meal.water_impact.toFixed(1)}L water</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, { backgroundColor: theme.colors.card }]}>
            <ChefHat size={48} color={theme.colors.success} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading your meals...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.gradient.success[0], theme.colors.gradient.success[1]]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Today's Meals</Text>
            <Text style={styles.headerSubtitle}>Track your nutrition and environmental impact</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Hero Image */}
        <View style={styles.heroImageContainer}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800' }}
            style={styles.heroImage}
          />
        </View>
      </LinearGradient>

      {/* Add Form */}
      {showAddForm && (
        <View style={[styles.addForm, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <LinearGradient
            colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
            style={styles.addFormGradient}
          >
            <View style={styles.formHeader}>
              <Sparkles size={20} color={theme.colors.accent} />
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>Add New Meal</Text>
            </View>
            
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface }]}
              placeholder="Enter meal name (e.g., Grilled Chicken Salad)"
              placeholderTextColor={theme.colors.placeholder}
              value={newMealName}
              onChangeText={setNewMealName}
            />
            
            <View style={styles.ingredientsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Add Ingredients (Optional)</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                Add each ingredient with its amount and unit for better accuracy
              </Text>

              <View style={styles.ingredientInputContainer}>
                <View style={styles.ingredientInputRow}>
                  <TextInput
                    style={[styles.input, styles.ingredientInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface }]}
                    placeholder="Ingredient"
                    placeholderTextColor={theme.colors.placeholder}
                    value={currentIngredient}
                    onChangeText={setCurrentIngredient}
                  />
                  <TextInput
                    style={[styles.input, styles.amountInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface }]}
                    placeholder="Amount"
                    placeholderTextColor={theme.colors.placeholder}
                    value={currentAmount}
                    onChangeText={setCurrentAmount}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.unitInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface }]}
                    placeholder="Unit"
                    placeholderTextColor={theme.colors.placeholder}
                    value={currentUnit}
                    onChangeText={setCurrentUnit}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.addIngredientButton, { backgroundColor: theme.colors.success }]}
                  onPress={handleAddIngredient}
                >
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {detailedIngredients.length > 0 && (
                <View style={styles.ingredientsList}>
                  <Text style={[styles.ingredientsListTitle, { color: theme.colors.text }]}>
                    Added Ingredients ({detailedIngredients.length})
                  </Text>
                  {detailedIngredients.map((ing, index) => (
                    <View key={index} style={[styles.ingredientItem, { backgroundColor: theme.colors.surface }]}>
                      <Text style={[styles.ingredientText, { color: theme.colors.text }]}>
                        {ing.ingredient} ({ing.amount}{ing.unit})
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveIngredient(index)}
                        style={styles.removeIngredientButton}
                      >
                        <X size={16} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowAddForm(false);
                  setNewMealName('');
                  setDetailedIngredients([]);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.success }]}
                onPress={handleAddMeal}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Adding...' : 'Add Meal'}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.searchIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
          <Search size={20} color={theme.colors.secondary} />
        </View>
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
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
              <Utensils size={48} color={theme.colors.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No meals logged yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
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
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Modal */}
      <EditMealModal
        isVisible={showEditModal}
        meal={editingMeal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMeal(null);
        }}
        onSave={handleSaveEditedMeal}
      />
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageContainer: {
    height: 100,
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
    padding: 20,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  ingredientsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  ingredientInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ingredientInputRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientsListTitle: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '500',
  },
  removeIngredientButton: {
    padding: 4,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
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
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  mealsContainer: {
    padding: 20,
    gap: 16,
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  mealTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mealActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsMenu: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  actionMenuText: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 32,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginLeft: 12,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  saveButton: {
    // backgroundColor handled by theme
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});