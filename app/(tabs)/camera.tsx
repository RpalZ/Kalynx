import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Upload, Sparkles, ChefHat, Leaf, Droplet, Clock, DollarSign, CircleCheck as CheckCircle, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  estimated_cost: number;
  carbon_impact: number;
  water_impact: number;
  created_at: string;
}

interface FridgeAnalysis {
  ingredients: string[];
  recipes: Recipe[];
  savedRecipes: Recipe[];
}

export default function CameraScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<FridgeAnalysis | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/auth');
      return;
    }
  };

  const handleImageUpload = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage(base64);
      await processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageBase64: string) => {
    setIsProcessing(true);
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
            imageBase64: imageBase64.split(',')[1], // Remove data:image/jpeg;base64, prefix
          }),
        }
      );

      if (response.ok) {
        const data: FridgeAnalysis = await response.json();
        setAnalysis(data);
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

  const triggerFileInput = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      Alert.alert('Camera', 'Camera functionality is available on mobile devices');
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
        {recipe.ingredients.map((ingredient, index) => (
          <Text key={index} style={styles.ingredientItem}>• {ingredient}</Text>
        ))}
      </View>

      <View style={styles.recipeMetrics}>
        <View style={styles.metricItem}>
          <DollarSign size={16} color="#059669" />
          <Text style={styles.metricText}>${recipe.estimated_cost.toFixed(2)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Leaf size={16} color="#16A34A" />
          <Text style={styles.metricText}>{recipe.carbon_impact.toFixed(2)} kg CO₂</Text>
        </View>
        <View style={styles.metricItem}>
          <Droplet size={16} color="#06B6D4" />
          <Text style={styles.metricText}>{recipe.water_impact.toFixed(1)}L</Text>
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
        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Fridge Photo</Text>
          
          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          )}

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={triggerFileInput}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Camera size={24} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>
                  {Platform.OS === 'web' ? 'Choose Photo' : 'Take Photo'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {selectedImage && (
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
          )}
        </View>

        {/* Processing Status */}
        {isProcessing && (
          <View style={styles.section}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.processingText}>Analyzing your fridge...</Text>
              <Text style={styles.processingSubtext}>
                AI is identifying ingredients and generating sustainable recipes
              </Text>
            </View>
          </View>
        )}

        {/* Analysis Results */}
        {analysis && !isProcessing && (
          <>
            {/* Detected Ingredients */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detected Ingredients</Text>
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
              <Camera size={20} color="#2563EB" />
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
  },
  previewImage: {
    width: '100%',
    height: 200,
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
});