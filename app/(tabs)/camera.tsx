import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Upload, Sparkles, ChefHat, Leaf, Droplet, Clock, DollarSign, CircleCheck as CheckCircle, X, Camera as CameraIcon, FlipHorizontal, Image as ImageIcon, Zap, Target } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { DesktopLayout } from '@/components/DesktopLayout';

const { width } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 1024;

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  estimated_cost: number;
  carbon_impact: number;
  water_impact: number;
  calories: number;
  protein: number;
  detailed_ingredients: { ingredient: string; amount: string; unit: string }[];
  created_at: string;
}

interface FridgeAnalysis {
  ingredients: string[];
  recipes: Recipe[];
  savedRecipes: Recipe[];
}

interface AddIngredientModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (ingredients: string[]) => void;
  newIngredient: string;
  setNewIngredient: (text: string) => void;
}

const AddIngredientModal = ({ isVisible, onClose, onAdd, newIngredient, setNewIngredient }: AddIngredientModalProps) => {
  const { theme } = useTheme();
  const [tempIngredients, setTempIngredients] = useState<string[]>([]);

  const handleAddToBatch = () => {
    if (!newIngredient.trim()) {
      Alert.alert('Error', 'Please enter an ingredient');
      return;
    }
    setTempIngredients([...tempIngredients, newIngredient.trim()]);
    setNewIngredient('');
  };

  const handleRemoveFromBatch = (index: number) => {
    setTempIngredients(tempIngredients.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (tempIngredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }
    onAdd(tempIngredients);
    setTempIngredients([]);
  };

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
            <Sparkles size={24} color={theme.colors.accent} />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Ingredients</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface }]}
              value={newIngredient}
              onChangeText={setNewIngredient}
              placeholder="Enter ingredient name"
              placeholderTextColor={theme.colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleAddToBatch}
            />
            <TouchableOpacity
              style={[styles.addToBatchButton, { backgroundColor: theme.colors.secondary }]}
              onPress={handleAddToBatch}
            >
              <Text style={styles.addToBatchButtonText}>Add to List</Text>
            </TouchableOpacity>
          </View>

          {tempIngredients.length > 0 && (
            <View style={styles.batchList}>
              <Text style={[styles.batchListTitle, { color: theme.colors.text }]}>Ingredients to Add:</Text>
              {tempIngredients.map((ingredient, index) => (
                <View key={index} style={[styles.batchItem, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.batchItemText, { color: theme.colors.text }]}>{ingredient}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveFromBatch(index)}
                    style={styles.removeButton}
                  >
                    <X size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => {
                setNewIngredient('');
                setTempIngredients([]);
                onClose();
              }}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.addButton, { backgroundColor: theme.colors.secondary }]}
              onPress={handleSubmit}
            >
              <Text style={styles.modalButtonText}>Add All ({tempIngredients.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function CameraScreen() {
  const { theme, isDark } = useTheme();
  const { getRemainingGenerations, incrementUsage } = useSubscription();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalImageData, setOriginalImageData] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FridgeAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddIngredientModalVisible, setIsAddIngredientModalVisible] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const cameraRef = useRef<CameraView>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [directRecipes, setDirectRecipes] = useState<Recipe[]>([]);
  const [manualIngredients, setManualIngredients] = useState<string[]>([]);
  const [manualRecipes, setManualRecipes] = useState<Recipe[]>([]);
  const [remainingGenerations, setRemainingGenerations] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    const checkPermission = async () => {
      if (!permission?.granted && mounted) {
        await requestPermission();
      }
    };
    
    checkPermission();
    
    return () => {
      mounted = false;
    };
  }, [permission]);

  useEffect(() => {
    checkRemainingGenerations();
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setSelectedImage(null);
      setOriginalImageData(null);
      setAnalysis(null);
    };
  }, []);

  const checkRemainingGenerations = async () => {
    const remaining = await getRemainingGenerations();
    setRemainingGenerations(remaining);
  };

  const processImage = useCallback(async (imageBase64: string) => {
    if (isProcessing) {
      Alert.alert('Error', 'Already processing an image');
      return;
    }

    // Check if user has remaining generations
    const remaining = await getRemainingGenerations();
    if (remaining === 0) {
      // This will be handled by the SubscriptionGate component
      return;
    }

    setIsProcessing(true);
    setAnalysis(null);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-recipes-from-fridge`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: imageBase64,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (response.ok) {
        const data: FridgeAnalysis = await response.json();
        const parsedRecipes = data.recipes.map(recipe => ({
          ...recipe,
          estimated_cost: Number(recipe.estimated_cost),
          carbon_impact: Number(recipe.carbon_impact),
          water_impact: Number(recipe.water_impact),
        }));
        setAnalysis({ ...data, recipes: parsedRecipes });
        
        // Increment usage count
        await incrementUsage('recipe_generation');
        await checkRemainingGenerations();
        
        Alert.alert(
          'Success!', 
          `Found ${data.ingredients.length} ingredients and generated ${data.recipes.length} recipes!`
        );
      } else {
        const errorText = await response.text();
        Alert.alert('Error', errorText || 'Failed to analyze image');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Analysis cancelled');
      } else {
        console.error('Error processing image:', error);
        Alert.alert('Error', 'Failed to process image');
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [isProcessing]);

  const generateManualRecipes = useCallback(async () => {
    if (isGeneratingRecipes || manualIngredients.length === 0) return;

    // Check if user has remaining generations
    const remaining = await getRemainingGenerations();
    if (remaining === 0) {
      // This will be handled by the SubscriptionGate component
      return;
    }

    setIsGeneratingRecipes(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-recipes-from-fridge`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ingredients: manualIngredients,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const parsedRecipes = data.recipes.map((recipe: Recipe) => ({
          ...recipe,
          estimated_cost: Number(recipe.estimated_cost),
          carbon_impact: Number(recipe.carbon_impact),
          water_impact: Number(recipe.water_impact),
        }));
        setManualRecipes(parsedRecipes);
        
        // Increment usage count
        await incrementUsage('recipe_generation');
        await checkRemainingGenerations();
        
        Alert.alert(
          'Success!', 
          `Generated ${parsedRecipes.length} sustainable recipes!`
        );
      } else {
        const errorText = await response.text();
        Alert.alert('Error', errorText || 'Failed to generate recipes');
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
      Alert.alert('Error', 'Failed to generate recipes');
    } finally {
      setIsGeneratingRecipes(false);
    }
  }, [isGeneratingRecipes, manualIngredients]);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        exif: false,
        skipProcessing: true,
      });

      setSelectedImage(photo.uri);
      if (photo.base64) {
        await processImage(photo.base64);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processImage]);

  const pickImage = useCallback(async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
        exif: false,
      });

      if (!result.canceled && result.assets[0].base64) {
        setSelectedImage(result.assets[0].uri);
        await processImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  }, [processImage]);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const logRecipeAsMeal = useCallback(async (recipe: Recipe) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/log-meal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mealName: recipe.title,
            ingredients: recipe.ingredients,
            calories: recipe.calories,
            protein: recipe.protein,
            carbon_impact: recipe.carbon_impact,
            water_impact: recipe.water_impact,
            detailed_ingredients: recipe.detailed_ingredients,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Recipe logged as meal!');
        router.push('/(tabs)/meals');
      } else {
        Alert.alert('Error', 'Failed to log recipe as meal');
      }
    } catch (error) {
      console.error('Error logging recipe:', error);
      Alert.alert('Error', 'Failed to log recipe');
    }
  }, []);

  const handleAddIngredient = useCallback(async (ingredients: string[]) => {
    if (analysis) {
      setIsProcessing(true);
      setIsAnalyzing(true);
      abortControllerRef.current = new AbortController();

      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          router.replace('/auth');
          return;
        }

        const updatedIngredients = [...analysis.ingredients, ...ingredients];

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-recipes-from-fridge`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: originalImageData,
              ingredients: updatedIngredients,
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (response.ok) {
          const data: FridgeAnalysis = await response.json();
          const parsedRecipes = data.recipes.map(recipe => ({
            ...recipe,
            estimated_cost: Number(recipe.estimated_cost),
            carbon_impact: Number(recipe.carbon_impact),
            water_impact: Number(recipe.water_impact),
          }));
          setAnalysis({ ...data, recipes: parsedRecipes });
          Alert.alert(
            'Success!', 
            `Added ${ingredients.length} ingredients and generated ${data.recipes.length} new recipes!`
          );
        } else {
          const errorText = await response.text();
          Alert.alert('Error', errorText || 'Failed to analyze with new ingredients');
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Analysis cancelled by user');
        } else {
          console.error('Error processing new ingredients:', error);
          Alert.alert('Error', 'Failed to process new ingredients');
        }
      } finally {
        setIsProcessing(false);
        setIsAnalyzing(false);
        abortControllerRef.current = null;
      }
    }
  }, [analysis, originalImageData]);

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const addManualIngredient = () => {
    if (newIngredient.trim()) {
      setManualIngredients([...manualIngredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeManualIngredient = (index: number) => {
    setManualIngredients(manualIngredients.filter((_, i) => i !== index));
  };

  const IngredientCard = ({ ingredient }: { ingredient: string }) => (
    <View style={[styles.ingredientCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.success }]}>
      <View style={[styles.ingredientIcon, { backgroundColor: `${theme.colors.success}20` }]}>
        <CheckCircle size={16} color={theme.colors.success} />
      </View>
      <Text style={[styles.ingredientText, { color: theme.colors.text }]}>{ingredient}</Text>
    </View>
  );

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <View style={[styles.recipeCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
        style={styles.recipeCardGradient}
      >
        <View style={styles.recipeHeader}>
          <View style={[styles.recipeIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
            <ChefHat size={20} color={theme.colors.warning} />
          </View>
          <Text style={[styles.recipeTitle, { color: theme.colors.text }]}>{recipe.title}</Text>
        </View>
        
        <View style={styles.recipeIngredients}>
          <Text style={[styles.ingredientsLabel, { color: theme.colors.text }]}>Ingredients:</Text>
          {recipe.detailed_ingredients && recipe.detailed_ingredients.length > 0 ? (
            recipe.detailed_ingredients.slice(0, 3).map((ingredient, index) => (
              <Text key={index} style={[styles.ingredientItem, { color: theme.colors.textSecondary }]}>
                • {ingredient.ingredient} ({ingredient.amount}{ingredient.unit})
              </Text>
            ))
          ) : (
            recipe.ingredients.slice(0, 3).map((ingredient, index) => (
              <Text key={index} style={[styles.ingredientItem, { color: theme.colors.textSecondary }]}>• {ingredient}</Text>
            ))
          )}
          {(recipe.detailed_ingredients?.length > 3 || recipe.ingredients.length > 3) && (
            <Text style={[styles.ingredientItem, { color: theme.colors.placeholder }]}>
              +{(recipe.detailed_ingredients?.length || recipe.ingredients.length) - 3} more...
            </Text>
          )}
        </View>

        <View style={styles.recipeMetrics}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                <DollarSign size={14} color={theme.colors.success} />
              </View>
              <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>${(recipe.estimated_cost ?? 0).toFixed(2)}</Text>
            </View>
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                <Leaf size={14} color={theme.colors.success} />
              </View>
              <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>{(recipe.carbon_impact ?? 0).toFixed(2)} kg CO₂</Text>
            </View>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: `${theme.colors.info}20` }]}>
                <Droplet size={14} color={theme.colors.info} />
              </View>
              <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>{(recipe.water_impact ?? 0).toFixed(1)}L</Text>
            </View>
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: `${theme.colors.error}20` }]}>
                <Target size={14} color={theme.colors.error} />
              </View>
              <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>{recipe.calories || 0} kcal</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logButton, { backgroundColor: theme.colors.success }]}
          onPress={() => logRecipeAsMeal(recipe)}
        >
          <Text style={styles.logButtonText}>Log as Meal</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const content = (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.gradient.accent[0], theme.colors.gradient.accent[1]]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>AI Recipe Generator</Text>
              <Text style={styles.headerSubtitle}>Scan your fridge to get sustainable recipe suggestions</Text>
              {remainingGenerations >= 0 && (
                <Text style={styles.generationsRemaining}>
                  {remainingGenerations === -1 ? 'Unlimited' : `${remainingGenerations} generations remaining today`}
                </Text>
              )}
            </View>
            <View style={[styles.aiIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}> 
              <Sparkles size={24} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>

        {/* Camera/Upload Section */}
        <SubscriptionGate feature="recipe_generation">
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Capture Fridge Photo</Text>
            
            {permission === null ? (
              <View style={[styles.cameraPlaceholder, { backgroundColor: theme.colors.surface }]}>
                <ActivityIndicator size="large" color={theme.colors.textSecondary} />
                <Text style={[styles.cameraPlaceholderText, { color: theme.colors.textSecondary }]}>Requesting camera permission...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={[styles.cameraPlaceholder, { backgroundColor: theme.colors.surface }]}>
                <CameraIcon size={48} color={theme.colors.disabled} />
                <Text style={[styles.cameraPlaceholderText, { color: theme.colors.textSecondary }]}>No access to camera. Please enable in settings.</Text>
              </View>
            ) : selectedImage ? (
              <View style={[styles.imagePreview, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => {
                    setSelectedImage(null);
                    setAnalysis(null);
                  }}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.cameraContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
                <View style={styles.cameraButtons}>
                  <TouchableOpacity style={styles.cameraButton} onPress={toggleCameraFacing}>
                    <FlipHorizontal size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                    <ImageIcon size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </SubscriptionGate>

        {/* Manual Ingredient Input Section */}
        <SubscriptionGate feature="recipe_generation">
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Add Ingredients Manually</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              Enter your ingredients to get recipe suggestions
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                placeholder="Enter ingredient..."
                placeholderTextColor={theme.colors.placeholder}
                value={newIngredient}
                onChangeText={setNewIngredient}
                onSubmitEditing={addManualIngredient}
              />
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.colors.secondary }]}
                onPress={addManualIngredient}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {manualIngredients.length > 0 && (
              <View style={styles.ingredientsList}>
                {manualIngredients.map((ingredient, index) => (
                  <View key={index} style={[styles.manualIngredientItem, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.manualIngredientText, { color: theme.colors.text }]}>{ingredient}</Text>
                    <TouchableOpacity onPress={() => removeManualIngredient(index)}>
                      <X size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.generateButton, { 
                backgroundColor: theme.colors.secondary,
                opacity: manualIngredients.length === 0 ? 0.5 : 1 
              }]}
              onPress={generateManualRecipes}
              disabled={isGeneratingRecipes || manualIngredients.length === 0}
            >
              {isGeneratingRecipes ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Sparkles size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.generateButtonText}>Generate Recipes</Text>
                </>
              )}
            </TouchableOpacity>

            {manualRecipes.length > 0 && (
              <View style={styles.recipesContainer}>
                {manualRecipes.map((recipe, index) => (
                  <RecipeCard key={index} recipe={recipe} />
                ))}
              </View>
            )}
          </View>
        </SubscriptionGate>

        {/* Processing Status */}
        {isProcessing && (
          <View style={styles.section}>
            <View style={[styles.processingCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <LinearGradient
                colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                style={styles.processingGradient}
              >
                <View style={[styles.processingIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                  <ActivityIndicator size="large" color={theme.colors.secondary} />
                </View>
                <Text style={[styles.processingText, { color: theme.colors.text }]}>Analyzing your ingredients...</Text>
                <Text style={[styles.processingSubtext, { color: theme.colors.textSecondary }]}>
                  AI is generating sustainable recipes with your ingredients
                </Text>
                {isAnalyzing && (
                  <TouchableOpacity
                    style={[styles.cancelAnalysisButton, { backgroundColor: theme.colors.error }]}
                    onPress={handleCancelAnalysis}
                  >
                    <Text style={styles.cancelAnalysisButtonText}>Cancel Analysis</Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Analysis Results */}
        {analysis && !isProcessing && (
          <>
            {/* Detected Ingredients */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Detected Ingredients</Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: theme.colors.secondary }]}
                  onPress={() => setIsAddIngredientModalVisible(true)}
                >
                  <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.ingredientsContainer}>
                {analysis.ingredients.map((ingredient, index) => (
                  <IngredientCard key={index} ingredient={ingredient} />
                ))}
              </View>
            </View>

            {/* Generated Recipes */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sustainable Recipe Suggestions</Text>
              {analysis.recipes.length > 0 ? (
                <View style={styles.recipesContainer}>
                  {analysis.recipes.map((recipe, index) => (
                    <RecipeCard key={index} recipe={recipe} />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
                    <ChefHat size={48} color={theme.colors.warning} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No recipes found</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                    Try uploading a clearer photo with more visible ingredients
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tips for Better Results</Text>
          <View style={styles.tipsContainer}>
            <View style={[styles.tipCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <LinearGradient
                colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                style={styles.tipCardGradient}
              >
                <View style={[styles.tipIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
                  <Sparkles size={20} color={theme.colors.warning} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Good Lighting</Text>
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                    Take photos in well-lit areas for better ingredient detection
                  </Text>
                </View>
              </LinearGradient>
            </View>
            <View style={[styles.tipCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <LinearGradient
                colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                style={styles.tipCardGradient}
              >
                <View style={[styles.tipIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                  <CameraIcon size={20} color={theme.colors.secondary} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Clear View</Text>
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                    Arrange items so labels and ingredients are clearly visible
                  </Text>
                </View>
              </LinearGradient>
            </View>
            <View style={[styles.tipCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <LinearGradient
                colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                style={styles.tipCardGradient}
              >
                <View style={[styles.tipIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                  <Leaf size={20} color={theme.colors.success} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Sustainable Choices</Text>
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                    Our AI prioritizes recipes with lower environmental impact
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <AddIngredientModal
        isVisible={isAddIngredientModalVisible}
        onClose={() => {
          setNewIngredient('');
          setIsAddIngredientModalVisible(false);
        }}
        onAdd={(ingredients) => {
          setIsAddIngredientModalVisible(false);
          handleAddIngredient(ingredients);
        }}
        newIngredient={newIngredient}
        setNewIngredient={setNewIngredient}
      />
    </SafeAreaView>
  );

  return isDesktop ? <DesktopLayout>{content}</DesktopLayout> : content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#E9D5FF',
  },
  generationsRemaining: {
    fontSize: 14,
    color: '#C4B5FD',
    marginTop: 8,
    fontWeight: '500',
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 4 / 3,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  camera: {
    flex: 1,
  },
  cameraButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  cameraButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
  },
  cameraPlaceholder: {
    aspectRatio: 4 / 3,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  cameraPlaceholderText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  imagePreview: {
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 4 / 3,
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ingredientsList: {
    gap: 8,
    marginBottom: 16,
  },
  manualIngredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  manualIngredientText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  processingCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  processingGradient: {
    padding: 24,
    alignItems: 'center',
  },
  processingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  cancelAnalysisButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelAnalysisButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  ingredientIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recipesContainer: {
    gap: 16,
  },
  recipeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  recipeCardGradient: {
    padding: 20,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  recipeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  recipeIngredients: {
    marginBottom: 16,
  },
  ingredientsLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  ingredientItem: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 18,
  },
  recipeMetrics: {
    gap: 8,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  logButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tipCardGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  batchList: {
    marginBottom: 20,
  },
  batchListTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  batchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  batchItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButtonText: {
  },
  addToBatchButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addToBatchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 32,
  },
});