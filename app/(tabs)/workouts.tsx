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
import { Plus, Search, Dumbbell, Clock, Flame, Timer } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

interface Workout {
  id: string;
  type: string;
  duration: number;
  calories_burned: number;
  created_at: string;
}

const WORKOUT_TYPES = [
  'Running', 'Walking', 'Cycling', 'Swimming', 'Weights', 
  'Yoga', 'Hiking', 'Basketball', 'Tennis', 'Dancing'
];

export default function WorkoutsScreen() {
  const { theme } = useTheme();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        Alert.alert('Error', 'Failed to load workouts');
      } else {
        setWorkouts(workoutsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load workouts');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkouts();
  };

  const handleAddWorkout = async () => {
    if (!selectedWorkoutType || !duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      Alert.alert('Error', 'Please select a workout type and enter a valid duration');
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
        Alert.alert('Success', 'Workout logged successfully!');
      } else {
        const errorData = await response.text();
        Alert.alert('Error', errorData || 'Failed to log workout');
      }
    } catch (error) {
      console.error('Error adding workout:', error);
      Alert.alert('Error', 'Failed to log workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWorkouts = workouts.filter(workout =>
    workout.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const WorkoutCard = ({ workout }: { workout: Workout }) => (
    <View style={[styles.workoutCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.workoutHeader}>
        <Dumbbell size={20} color={theme.colors.secondary} />
        <Text style={[styles.workoutType, { color: theme.colors.text }]}>{workout.type}</Text>
      </View>
      <View style={styles.workoutStats}>
        <View style={styles.statItem}>
          <Clock size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{workout.duration} min</Text>
        </View>
        <View style={styles.statItem}>
          <Flame size={16} color={theme.colors.error} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{Math.round(workout.calories_burned)} kcal</Text>
        </View>
      </View>
      <Text style={[styles.workoutTime, { color: theme.colors.placeholder }]}>
        {new Date(workout.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading workouts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Today's Workouts</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={[styles.addForm, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>Workout Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutTypes}>
            {WORKOUT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.workoutTypeButton,
                  { borderColor: theme.colors.border },
                  selectedWorkoutType === type && { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }
                ]}
                onPress={() => setSelectedWorkoutType(type)}
              >
                <Text style={[
                  styles.workoutTypeButtonText,
                  { color: theme.colors.textSecondary },
                  selectedWorkoutType === type && styles.workoutTypeButtonTextActive
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>Duration (minutes)</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
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
        </View>
      )}

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Search size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search workouts..."
          placeholderTextColor={theme.colors.placeholder}
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
        {filteredWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Dumbbell size={48} color={theme.colors.disabled} />
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
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addForm: {
    padding: 16,
    borderBottomWidth: 1,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  workoutTypes: {
    marginBottom: 16,
  },
  workoutTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTypeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  workoutTypeButtonText: {
    fontSize: 14,
  },
  workoutTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 12,
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
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  workoutsContainer: {
    padding: 16,
    gap: 12,
  },
  workoutCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  workoutType: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  workoutStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
  },
  workoutTime: {
    fontSize: 12,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});