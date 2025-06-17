import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Upload, Sparkles, ChefHat, Leaf, Droplet, Clock, DollarSign, CircleCheck as CheckCircle, X, Camera as CameraIcon, FlipHorizontal, Image as ImageIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Ingredients</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newIngredient}
              onChangeText={setNewIngredient}
              placeholder="Enter ingredient name"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleAddToBatch}
            />
            <TouchableOpacity
              style={styles.addToBatchButton}
              onPress={handleAddToBatch}
            >
              <Text style={styles.addToBatchButtonText}>Add to List</Text>
            </TouchableOpacity>
          </View>

          {tempIngredients.length > 0 && (
            <View style={styles.batchList}>
              <Text style={styles.batchListTitle}>Ingredients to Add:</Text>
              {tempIngredients.map((ingredient, index) => (
                <View key={index} style={styles.batchItem}>
                  <Text style={styles.batchItemText}>{ingredient}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveFromBatch(index)}
                    style={styles.removeButton}
                  >
                    <X size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setNewIngredient('');
                setTempIngredients([]);
                onClose();
              }}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.addButton]}
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

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });
      setSelectedImage(photo.uri);
      if (photo.base64) {
        processImage(photo.base64);
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      if (result.assets[0].base64) {
        processImage(result.assets[0].base64);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const processImage = async (imageBase64: string) => {
    setIsProcessing(true);
    setAnalysis(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      // Store the original image data
      setOriginalImageData(imageBase64);

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
        }
      );

      if (response.ok) {
        const data: FridgeAnalysis = await response.json();
        // Ensure numeric fields are parsed as numbers
        const parsedRecipes = data.recipes.map(recipe => ({
          ...recipe,
          estimated_cost: Number(recipe.estimated_cost),
          carbon_impact: Number(recipe.carbon_impact),
          water_impact: Number(recipe.water_impact),
        }));
        setAnalysis({ ...data, recipes: parsedRecipes });
        Alert.alert(
          'Success!', 
          `Found ${data.ingredients.length} ingredients and generated ${data.recipes.length} recipes!`
        );
      } else {
        const errorText = await response.text();
        Alert.alert('Error', errorText || 'Failed to analyze image');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const logRecipeAsMeal = async (recipe: Recipe) => {
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
  };

  const handleAddIngredient = async (ingredients: string[]) => {
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

        // Add all new ingredients to the existing list
        const updatedIngredients = [...analysis.ingredients, ...ingredients];

        // Call the generate-recipes-from-fridge function with the original image data
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
          // Ensure numeric fields are parsed as numbers
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
      } catch (error: unknown) {
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
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const IngredientCard = ({ ingredient }: { ingredient: string }) => (
    <View style={styles.ingredientCard}>
      <CheckCircle size={16} color="#16A34A" />
      <Text style={styles.ingredientText}>{ingredient}</Text>
    </View>
  );

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <View style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <ChefHat size={20} color="#F59E0B" />
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
      </View>
      
      <View style={styles.recipeIngredients}>
        <Text style={styles.ingredientsLabel}>Ingredients:</Text>
        {recipe.detailed_ingredients && recipe.detailed_ingredients.length > 0 ? (
          recipe.detailed_ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.ingredientItem}>
              • {ingredient.ingredient} ({ingredient.amount}{ingredient.unit})
            </Text>
          ))
        ) : (
          recipe.ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.ingredientItem}>• {ingredient}</Text>
          ))
        )}
      </View>

      <View style={styles.recipeMetrics}>
        <View style={styles.metricItem}>
          <DollarSign size={16} color="#059669" />
          <Text style={styles.metricText}>${(recipe.estimated_cost ?? 0).toFixed(2)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Leaf size={16} color="#16A34A" />
          <Text style={styles.metricText}>{(recipe.carbon_impact ?? 0).toFixed(2)} kg CO₂</Text>
        </View>
        <View style={styles.metricItem}>
          <Droplet size={16} color="#06B6D4" />
          <Text style={styles.metricText}>{(recipe.water_impact ?? 0).toFixed(1)}L</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logButton}
        onPress={() => logRecipeAsMeal(recipe)}
      >
        <Text style={styles.logButtonText}>Log as Meal</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#2563EB', '#3B82F6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>AI Recipe Generator</Text>
        <Text style={styles.headerSubtitle}>Scan your fridge to get sustainable recipe suggestions</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        {/* Camera/Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capture Fridge Photo</Text>
          
          {permission === null ? (
            <View style={styles.cameraPlaceholder}>
              <ActivityIndicator size="large" color="#6B7280" />
              <Text style={styles.cameraPlaceholderText}>Requesting camera permission...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraPlaceholderText}>No access to camera. Please enable in settings.</Text>
            </View>
          ) : selectedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setAnalysis(null);
                }}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraContainer}>
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

        {/* Processing Status */}
        {isProcessing && (
          <View style={styles.section}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.processingText}>Analyzing your ingredients...</Text>
              <Text style={styles.processingSubtext}>
                AI is generating sustainable recipes with your new ingredients
              </Text>
              {isAnalyzing && (
                <TouchableOpacity
                  style={styles.cancelAnalysisButton}
                  onPress={handleCancelAnalysis}
                >
                  <Text style={styles.cancelAnalysisButtonText}>Cancel Analysis</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Analysis Results */}
        {analysis && !isProcessing && (
          <>
            {/* Detected Ingredients */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Detected Ingredients</Text>
                <TouchableOpacity
                  style={styles.addButton}
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
              <Text style={styles.sectionTitle}>Sustainable Recipe Suggestions</Text>
              {analysis.recipes.length > 0 ? (
                <View style={styles.recipesContainer}>
                  {analysis.recipes.map((recipe, index) => (
                    <RecipeCard key={index} recipe={recipe} />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <ChefHat size={48} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No recipes found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try uploading a clearer photo with more visible ingredients
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Better Results</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <Sparkles size={20} color="#F59E0B" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Good Lighting</Text>
                <Text style={styles.tipText}>
                  Take photos in well-lit areas for better ingredient detection
                </Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <CameraIcon size={20} color="#2563EB" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Clear View</Text>
                <Text style={styles.tipText}>
                  Arrange items so labels and ingredients are clearly visible
                </Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <Leaf size={20} color="#16A34A" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Sustainable Choices</Text>
                <Text style={styles.tipText}>
                  Our AI prioritizes recipes with lower environmental impact
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <AddIngredientModal
        isVisible={isAddIngredientModalVisible}
        onClose={() => {
          setNewIngredient('');
          setIsAddIngredientModalVisible(false);
        }}
        onAdd={(ingredients) => {
          setIsAddIngredientModalVisible(false); // Close modal immediately
          handleAddIngredient(ingredients);
        }}
        newIngredient={newIngredient}
        setNewIngredient={setNewIngredient}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    color: '#DBEAFE',
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
  uploadButton: {
    backgroundColor: '#2563EB',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imagePreview: {
    marginTop: 16,
    position: 'relative',
    alignItems: 'center',
    width: '100%',
    aspectRatio: 4 / 3,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  ingredientText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  recipesContainer: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  recipeIngredients: {
    marginBottom: 16,
  },
  ingredientsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  ingredientItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  recipeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  logButton: {
    backgroundColor: '#16A34A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  cameraContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  cameraButton: {
    padding: 10,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
  },
  cameraPlaceholder: {
    aspectRatio: 4 / 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  cameraPlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addToBatchButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  addToBatchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  batchList: {
    marginBottom: 16,
  },
  batchListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  batchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  batchItemText: {
    fontSize: 14,
    color: '#111827',
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  addButton: {
    backgroundColor: '#2563EB',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#374151',
  },
  cancelAnalysisButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  cancelAnalysisButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});