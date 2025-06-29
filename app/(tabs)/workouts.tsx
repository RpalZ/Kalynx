import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, Dumbbell, Clock, Flame, Timer, Zap, Target, TrendingUp, CreditCard as Edit3, Trash2, Save, X, MoveVertical as MoreVertical } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomAlert } from '@/components/CustomAlert';
import { useToast } from '@/components/Toast';

const { width } = Dimensions.get('window');

interface Workout {
  id: string;
  type: string;
  duration: number;
  calories_burned: number;
  created_at: string;
}

const WORKOUT_TYPES = [
  { name: 'Running', icon: '🏃‍♂️', color: '#EF4444' },
  { name: 'Walking', icon: '🚶‍♂️', color: '#10B981' },
  { name: 'Cycling', icon: '🚴‍♂️', color: '#3B82F6' },
  { name: 'Swimming', icon: '🏊‍♂️', color: '#06B6D4' },
  { name: 'Weights', icon: '🏋️‍♂️', color: '#8B5CF6' },
  { name: 'Yoga', icon: '🧘‍♀️', color: '#F59E0B' },
  { name: 'Hiking', icon: '🥾', color: '#059669' },
  { name: 'Basketball', icon: '🏀', color: '#DC2626' },
  { name: 'Tennis', icon: '🎾', color: '#7C3AED' },
  { name: 'Dancing', icon: '💃', color: '#EC4899' },
];

interface EditWorkoutModalProps {
  isVisible: boolean;
  workout: Workout | null;
  onClose: () => void;
  onSave: (updatedWorkout: Workout) => void;
}

const EditWorkoutModal = ({ isVisible, workout, onClose, onSave }: EditWorkoutModalProps) => {
  const { theme, isDark } = useTheme();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { showToast, ToastComponent } = useToast();
  const [editedWorkout, setEditedWorkout] = useState<Workout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (workout) {
      setEditedWorkout({ ...workout });
    }
  }, [workout]);

  const handleSave = async () => {
    if (!editedWorkout) return;

    // Validate inputs
    if (!editedWorkout.type.trim()) {
      showAlert({
        type: 'error',
        title: 'Invalid Input',
        message: 'Workout type cannot be empty',
      });
      return;
    }

    if (editedWorkout.duration <= 0 || editedWorkout.calories_burned < 0) {
      showAlert({
        type: 'error',
        title: 'Invalid Values',
        message: 'Duration must be positive and calories cannot be negative',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      console.log('🔄 Updating workout with ID:', editedWorkout.id);
      console.log('📊 Update data:', {
        type: editedWorkout.type.trim(),
        duration: Number(editedWorkout.duration),
        calories_burned: Number(editedWorkout.calories_burned),
      });

      const token = session.session.access_token;
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/update-workout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workoutId: editedWorkout.id,
            type: editedWorkout.type.trim(),
            duration: Number(editedWorkout.duration),
            calories_burned: Number(editedWorkout.calories_burned),
          }),
        }
      );

      console.log('📡 Update response status:', response.status);
      
      if (response.ok) {
        const updatedWorkout = await response.json();
        console.log('✅ Workout updated successfully:', updatedWorkout);
        onSave(updatedWorkout);
        onClose();
        showToast({
          type: 'success',
          message: 'Workout updated successfully!',
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Error updating workout:', response.status, errorText);
        showAlert({
          type: 'error',
          title: 'Update Failed',
          message: errorText || 'Failed to update workout',
        });
      }
    } catch (error) {
      console.error('💥 Error updating workout:', error);
      showAlert({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to update workout. Please check your connection.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!editedWorkout) return null;

  return (
    <>
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
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Workout</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Workout Type</Text>
                <TextInput
                  style={[styles.modalInput, { 
                    borderColor: theme.colors.border, 
                    color: theme.colors.text, 
                    backgroundColor: theme.colors.surface 
                  }]}
                  value={editedWorkout.type}
                  onChangeText={(text) => setEditedWorkout({ ...editedWorkout, type: text })}
                  placeholder="Enter workout type"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Duration (minutes)</Text>
                  <TextInput
                    style={[styles.modalInput, { 
                      borderColor: theme.colors.border, 
                      color: theme.colors.text, 
                      backgroundColor: theme.colors.surface 
                    }]}
                    value={editedWorkout.duration.toString()}
                    onChangeText={(text) => setEditedWorkout({ ...editedWorkout, duration: Number(text) || 0 })}
                    placeholder="0"
                    placeholderTextColor={theme.colors.placeholder}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Calories Burned</Text>
                  <TextInput
                    style={[styles.modalInput, { 
                      borderColor: theme.colors.border, 
                      color: theme.colors.text, 
                      backgroundColor: theme.colors.surface 
                    }]}
                    value={editedWorkout.calories_burned.toString()}
                    onChangeText={(text) => setEditedWorkout({ ...editedWorkout, calories_burned: Number(text) || 0 })}
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
      {AlertComponent}
      {ToastComponent}
    </>
  );
};

export default function WorkoutsScreen() {
  const { theme, isDark } = useTheme();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { showToast, ToastComponent } = useToast();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/auth');
      return;
    }
    fetchWorkouts();
  };

  const fetchWorkouts = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      const { data: workoutsData, error } = await supabase
        .from('workouts')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workouts:', error);
        showAlert({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load workouts. Please try again.',
        });
      } else {
        setWorkouts(workoutsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to load workouts. Please check your connection.',
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkouts();
  };

  const handleDeleteWorkout = async (workoutId: string, workoutType: string) => {
    showAlert({
      type: 'warning',
      title: 'Delete Workout',
      message: `Are you sure you want to delete "${workoutType}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: session } = await supabase.auth.getSession();
              
              if (!session.session) {
                router.replace('/auth');
                return;
              }

              console.log('🗑️ Deleting workout with ID:', workoutId);

              const token = session.session.access_token;
              const requestBody = { workoutId: workoutId };
              
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-workout`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(requestBody),
                }
              );

              console.log('📡 Delete response status:', response.status);

              if (response.ok) {
                const result = await response.json();
                console.log('✅ Workout deleted successfully:', result);
                
                setWorkouts(prevWorkouts => prevWorkouts.filter(workout => workout.id !== workoutId));
                showToast({
                  type: 'success',
                  message: 'Workout deleted successfully!',
                });
              } else {
                const errorText = await response.text();
                console.error('❌ Error deleting workout:', response.status, errorText);
                showAlert({
                  type: 'error',
                  title: 'Delete Failed',
                  message: errorText || 'Failed to delete workout',
                });
              }
            } catch (error) {
              console.error('💥 Error deleting workout:', error);
              showAlert({
                type: 'error',
                title: 'Network Error',
                message: 'Failed to delete workout. Please check your connection and try again.',
              });
            }
          }
        }
      ]
    });
  };

  const handleEditWorkout = (workout: Workout) => {
    console.log('✏️ Editing workout:', workout);
    setEditingWorkout(workout);
    setShowEditModal(true);
  };

  const handleSaveEditedWorkout = (updatedWorkout: Workout) => {
    console.log('💾 Saving edited workout:', updatedWorkout);
    setWorkouts(workouts.map(workout => workout.id === updatedWorkout.id ? updatedWorkout : workout));
    setShowEditModal(false);
    setEditingWorkout(null);
  };

  const handleAddWorkout = async () => {
    if (!selectedWorkoutType || !duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      showAlert({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please select a workout type and enter a valid duration',
      });
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
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/log-workout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workoutType: selectedWorkoutType,
            duration: Number(duration),
          }),
        }
      );

      if (response.ok) {
        setSelectedWorkoutType('');
        setDuration('');
        setShowAddForm(false);
        fetchWorkouts();
        showToast({
          type: 'success',
          message: 'Workout logged successfully!',
        });
      } else {
        const errorData = await response.text();
        showAlert({
          type: 'error',
          title: 'Failed to Log Workout',
          message: errorData || 'Failed to log workout',
        });
      }
    } catch (error) {
      console.error('Error adding workout:', error);
      showAlert({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to log workout. Please check your connection.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWorkouts = workouts.filter(workout =>
    workout.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getWorkoutTypeInfo = (type: string) => {
    return WORKOUT_TYPES.find(w => w.name.toLowerCase() === type.toLowerCase()) || 
           { name: type, icon: '💪', color: theme.colors.secondary };
  };

  const WorkoutCard = ({ workout }: { workout: Workout }) => {
    const workoutInfo = getWorkoutTypeInfo(workout.type);
    const [showActions, setShowActions] = useState(false);
    
    return (
      <View style={[styles.workoutCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
          style={styles.workoutCardGradient}
        >
          <View style={styles.workoutHeader}>
            <View style={[styles.workoutIcon, { backgroundColor: `${workoutInfo.color}20` }]}>
              <Text style={styles.workoutEmoji}>{workoutInfo.icon}</Text>
            </View>
            <View style={styles.workoutInfo}>
              <Text style={[styles.workoutType, { color: theme.colors.text }]}>{workout.type}</Text>
              <View style={styles.workoutTime}>
                <Clock size={12} color={theme.colors.placeholder} />
                <Text style={[styles.workoutTimeText, { color: theme.colors.placeholder }]}>
                  {new Date(workout.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.workoutActions}>
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
                  handleEditWorkout(workout);
                }}
              >
                <Edit3 size={16} color={theme.colors.secondary} />
                <Text style={[styles.actionMenuText, { color: theme.colors.text }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => {
                  setShowActions(false);
                  handleDeleteWorkout(workout.id, workout.type);
                }}
              >
                <Trash2 size={16} color={theme.colors.error} />
                <Text style={[styles.actionMenuText, { color: theme.colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.workoutStats}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                <Timer size={14} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{workout.duration} min</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.colors.error}20` }]}>
                <Flame size={14} color={theme.colors.error} />
              </View>
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{Math.round(workout.calories_burned)} kcal</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const WorkoutTypeButton = ({ workout }: { workout: typeof WORKOUT_TYPES[0] }) => (
    <TouchableOpacity
      style={[
        styles.workoutTypeButton,
        { 
          borderColor: theme.colors.border,
          backgroundColor: selectedWorkoutType === workout.name ? `${workout.color}20` : theme.colors.surface
        },
        selectedWorkoutType === workout.name && { borderColor: workout.color, borderWidth: 2 }
      ]}
      onPress={() => setSelectedWorkoutType(workout.name)}
    >
      <Text style={styles.workoutTypeEmoji}>{workout.icon}</Text>
      <Text style={[
        styles.workoutTypeButtonText,
        { 
          color: selectedWorkoutType === workout.name ? workout.color : theme.colors.textSecondary,
          fontWeight: selectedWorkoutType === workout.name ? '700' : '500'
        }
      ]}>
        {workout.name}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, { backgroundColor: theme.colors.card }]}>
            <Dumbbell size={48} color={theme.colors.secondary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading your workouts...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={64}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, flex: 1 }]}> 
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <LinearGradient
            colors={[theme.colors.gradient.secondary[0], theme.colors.gradient.secondary[1]]}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Today's Workouts</Text>
                <Text style={styles.headerSubtitle}>Track your fitness activities and progress</Text>
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
                source={{ uri: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=800' }}
                style={styles.heroImage}
              />
            </View>
          </LinearGradient>
          {/* Add Form */}
          {showAddForm && (
            <View style={[styles.addForm, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}> 
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <LinearGradient
                  colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                  style={styles.addFormGradient}
                >
                  <View style={styles.formHeader}>
                    <Zap size={20} color={theme.colors.secondary} />
                    <Text style={[styles.formTitle, { color: theme.colors.text }]}>Log New Workout</Text>
                  </View>
                  <Text style={[styles.formLabel, { color: theme.colors.text }]}>Workout Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutTypes}>
                    {WORKOUT_TYPES.map((workout) => (
                      <WorkoutTypeButton key={workout.name} workout={workout} />
                    ))}
                  </ScrollView>
                  <Text style={[styles.formLabel, { color: theme.colors.text }]}>Duration (minutes)</Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface }]}
                    placeholder="Enter duration in minutes"
                    placeholderTextColor={theme.colors.placeholder}
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                  />
                  <View style={styles.formButtons}>
                    <TouchableOpacity
                      style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                      onPress={() => {
                        setShowAddForm(false);
                        setSelectedWorkoutType('');
                        setDuration('');
                      }}
                    >
                      <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: theme.colors.secondary }]}
                      onPress={handleAddWorkout}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Adding...' : 'Add Workout'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </ScrollView>
            </View>
          )}
          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.searchIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
              <Search size={20} color={theme.colors.secondary} />
            </View>
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search workouts..."
              placeholderTextColor={theme.colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {/* Workouts List */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filteredWorkouts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                  <Dumbbell size={48} color={theme.colors.secondary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No workouts logged yet</Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                  {searchQuery ? 'No workouts match your search' : 'Start tracking your workouts to see your fitness progress'}
                </Text>
              </View>
            ) : (
              <View style={styles.workoutsContainer}>
                {filteredWorkouts.map((workout) => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))}
              </View>
            )}
            <View style={styles.bottomSpacing} />
          </ScrollView>
          {/* Edit Modal */}
          <EditWorkoutModal
            isVisible={showEditModal}
            workout={editingWorkout}
            onClose={() => {
              setShowEditModal(false);
              setEditingWorkout(null);
            }}
            onSave={handleSaveEditedWorkout}
          />
          {/* Global Alert and Toast Components */}
          {AlertComponent}
          {ToastComponent}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
    color: '#DBEAFE',
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
  formLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 16,
  },
  workoutTypes: {
    marginBottom: 16,
  },
  workoutTypeButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 80,
    gap: 8,
  },
  workoutTypeEmoji: {
    fontSize: 24,
  },
  workoutTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  workoutsContainer: {
    padding: 20,
    gap: 16,
  },
  workoutCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  workoutCardGradient: {
    padding: 20,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutEmoji: {
    fontSize: 20,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  workoutTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  workoutActions: {
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
  workoutStats: {
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