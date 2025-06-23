import { createClient } from 'npm:@supabase/supabase-js@2';
import { ImageAnnotatorClient } from 'npm:@google-cloud/vision'; // For Google Cloud Vision

interface FridgePhotoRequest {
  imageBase64?: string;
  ingredients?: string[];
  latitude?: number;
  longitude?: number;
}

interface Recipe {
  title: string;
  ingredients: string[];
  carbon_impact: number;
  water_impact: number;
  estimated_cost: number;
  calories: number;
  protein: number;
  detailed_ingredients: { ingredient: string; amount: string; unit: string }[];
}

// Price database for common ingredients (in USD)
const BASE_INGREDIENT_PRICES: { [key: string]: number } = {
  // Vegetables
  'tomato': 0.5,
  'potato': 0.4,
  'onion': 0.3,
  'carrot': 0.2,
  'lettuce': 1.0,
  'spinach': 2.0,
  'broccoli': 1.5,
  'cauliflower': 2.0,
  'bell pepper': 1.0,
  'cucumber': 0.8,
  'mushroom': 2.5,
  
  // Fruits
  'apple': 0.8,
  'banana': 0.3,
  'orange': 0.6,
  'lemon': 0.5,
  'lime': 0.4,
  'strawberry': 3.0,
  'blueberry': 4.0,
  'raspberry': 4.0,
  
  // Proteins
  'chicken': 3.0,
  'beef': 5.0,
  'pork': 4.0,
  'fish': 6.0,
  'salmon': 8.0,
  'tuna': 3.0,
  'egg': 0.3,
  'tofu': 2.0,
  
  // Dairy
  'milk': 3.0,
  'cheese': 4.0,
  'yogurt': 2.0,
  'butter': 3.0,
  'cream': 2.5,
  
  // Grains & Starches
  'rice': 1.0,
  'pasta': 1.5,
  'bread': 2.0,
  'flour': 2.0,
  'potato': 0.4,
  
  // Pantry Items
  'oil': 5.0,
  'salt': 1.0,
  'pepper': 2.0,
  'sugar': 1.0,
  'honey': 4.0,
  'garlic': 0.5,
  'ginger': 1.0,
  
  // Default price for unknown ingredients
  'default': 2.0
};

// Regional cost of living multipliers (based on Numbeo's Cost of Living Index)
const REGIONAL_MULTIPLIERS: { [key: string]: number } = {
  // North America
  'US': 1.0, // Base (US average)
  'CA': 1.1, // Canada
  'MX': 0.6, // Mexico
  
  // Europe
  'GB': 1.2, // United Kingdom
  'DE': 1.1, // Germany
  'FR': 1.15, // France
  'IT': 1.05, // Italy
  'ES': 0.9, // Spain
  
  // Asia
  'IN': 0.4, // India
  'CN': 0.8, // China
  'JP': 1.3, // Japan
  'SG': 1.2, // Singapore
  
  // Oceania
  'AU': 1.3, // Australia
  'NZ': 1.25, // New Zealand
  
  // Default multiplier if country not found
  'default': 1.0
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Max-Age': '86400',
};

// Function to get country code from coordinates using reverse geocoding
async function getCountryCodeFromCoordinates(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=0&addressdetails=1`
    );
    
    if (!response.ok) {
      console.warn('Failed to get location data, using default prices');
      return 'default';
    }
    
    const data = await response.json();
    return data.address?.country_code?.toUpperCase() || 'default';
  } catch (error) {
    console.warn('Error getting location data:', error);
    return 'default';
  }
}

// Function to calculate recipe cost based on ingredients and location
async function calculateRecipeCost(
  ingredients: string[], 
  latitude?: number, 
  longitude?: number
): Promise<number> {
  console.log('calculateRecipeCost: Ingredients received:', ingredients);
  console.log('calculateRecipeCost: Latitude/Longitude received:', latitude, longitude);

  let totalCost = 0;
  let regionalMultiplier = 1.0;
  
  // If coordinates are provided, get the country code and apply regional multiplier
  if (latitude && longitude) {
    const countryCode = await getCountryCodeFromCoordinates(latitude, longitude);
    console.log('calculateRecipeCost: Detected country code:', countryCode);
    regionalMultiplier = REGIONAL_MULTIPLIERS[countryCode] || REGIONAL_MULTIPLIERS.default;
    console.log('calculateRecipeCost: Regional multiplier:', regionalMultiplier);
  }
  
  ingredients.forEach(ingredient => {
    // Convert ingredient to lowercase and remove any measurements or quantities
    const cleanIngredient = ingredient.toLowerCase()
      .replace(/\d+\s*(g|kg|ml|l|oz|lb|cup|tbsp|tsp|piece|pieces|slice|slices)/g, '')
      .trim();
    console.log('calculateRecipeCost: Processing ingredient:', ingredient, 'Cleaned:', cleanIngredient);
    
    // Find the best matching ingredient in our price database
    const matchingIngredient = Object.keys(BASE_INGREDIENT_PRICES).find(key => 
      cleanIngredient.includes(key)
    );
    console.log('calculateRecipeCost: Matching ingredient key:', matchingIngredient);
    
    // Add the price of the ingredient (or default price if not found)
    const basePrice = matchingIngredient ? 
      BASE_INGREDIENT_PRICES[matchingIngredient] : 
      BASE_INGREDIENT_PRICES.default;
    console.log('calculateRecipeCost: Base price for ingredient:', basePrice);
    
    // Apply regional multiplier
    const ingredientCost = basePrice * regionalMultiplier;
    totalCost += ingredientCost;
    console.log('calculateRecipeCost: Ingredient cost:', ingredientCost, 'Current totalCost:', totalCost);
  });
  
  console.log('calculateRecipeCost: Final totalCost:', totalCost);
  return Number(totalCost.toFixed(2));
}

// Add cache for recipe generation
const recipeCache = new Map<string, Recipe[]>();

// Optimize the system prompt to be more concise and focused on manual ingredients
const SYSTEM_PROMPT = `Generate 3 quick, healthy recipes using these ingredients. For each recipe, provide:
- Title
- Ingredients list (only use the provided ingredients)
- Carbon impact (kg CO2e)
- Water impact (liters)
- Cost (USD)
- Calories
- Protein (g)
- Detailed ingredients with amounts

Format as JSON array. Focus on quick recipes with minimal ingredients.`;

async function generateRecipesFromIngredients(
  ingredients: string[],
  latitude?: number,
  longitude?: number
): Promise<Recipe[]> {
  console.log('Generating recipes for ingredients:', ingredients);

  const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

  if (!DEEPSEEK_API_KEY) {
    console.error('DeepSeek API key not set.');
    throw new Error('DeepSeek API key is missing.');
  }

  // Create cache key from sorted ingredients
  const cacheKey = ingredients.sort().join(',');
  
  // Check cache first
  if (recipeCache.has(cacheKey)) {
    console.log('Returning cached recipes');
    return recipeCache.get(cacheKey)!;
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Ingredients: ${ingredients.join(', ')}` },
  ];

  try {
    console.log('Sending request to DeepSeek API');
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.7, // Increased for more variety in recipes
        max_tokens: 1500, // Increased for more detailed recipes
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      throw new Error(`DeepSeek API call failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const recipesData = JSON.parse(data.choices[0].message.content);

    // Process recipes in parallel
    const recipesPromises = recipesData.recipes.map(async (recipe: any) => {
      let normalizedIngredients: string[];
      if (Array.isArray(recipe.ingredients)) {
        normalizedIngredients = recipe.ingredients.map((ing: any) => {
          if (typeof ing === 'string') return ing;
          if (ing && typeof ing === 'object') {
            // Format as 'ingredient (amount unit)' if possible
            const name = ing.name || JSON.stringify(ing.name);
            const amount = ing.amount ? ` (${ing.amount}${ing.unit || ''})` : '';
            return `${name}${amount}`;
          }
          return String(ing);
        });
      } else {
        normalizedIngredients = [];
      }
      const cost = await calculateRecipeCost(normalizedIngredients, latitude, longitude);
      return {
        title: recipe.title,
        ingredients: normalizedIngredients,
        estimated_cost: cost,
        carbon_impact: recipe.carbon_impact,
        water_impact: recipe.water_impact,
        calories: recipe.calories,
        protein: recipe.protein,
        detailed_ingredients: recipe.detailed_ingredients || [],
        created_at: new Date().toISOString(),
      };
    });

    const generatedRecipes = await Promise.all(recipesPromises);

    // Cache the results
    recipeCache.set(cacheKey, generatedRecipes);

    // Clear old cache entries (keep last 100)
    if (recipeCache.size > 100) {
      const keysToDelete = Array.from(recipeCache.keys()).slice(0, recipeCache.size - 100);
      keysToDelete.forEach(key => recipeCache.delete(key));
    }

    return generatedRecipes;

  } catch (error) {
    console.error('Error generating recipes:', error);
    throw error;
  }
}

// Optimize image detection
async function detectIngredientsFromImage(imageBase64: string): Promise<string[]> {
  const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY');

  if (!GOOGLE_VISION_API_KEY) {
    console.error('Google Vision API key not set.');
    throw new Error('Google Vision API key is missing.');
  }

  try {
    // Reduce image size if needed
    const maxSize = 1024 * 1024; // 1MB
    let processedImage = imageBase64;
    if (imageBase64.length > maxSize) {
      // Implement image compression here if needed
      console.log('Image too large, consider implementing compression');
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: processedImage
              },
              features: [
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 5 // Reduced from 10
                },
                {
                  type: 'OBJECT_LOCALIZATION',
                  maxResults: 5 // Reduced from 10
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Vision API error:', response.status, errorText);
      throw new Error(`Google Vision API call failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const labels = new Set<string>();

    // Optimize label extraction
    const extractLabels = (annotations: any[]) => {
      if (!annotations) return;
      annotations.forEach((item: any) => {
        if (item.description || item.name) {
          labels.add((item.description || item.name).toLowerCase());
        }
      });
    };

    extractLabels(data.responses?.[0]?.labelAnnotations);
    extractLabels(data.responses?.[0]?.localizedObjectAnnotations);

    // Optimize food keyword matching
    const foodKeywords = new Set([
      'food', 'fruit', 'vegetable', 'meat', 'dairy', 'drink', 'beverage',
      'apple', 'banana', 'orange', 'tomato', 'potato', 'carrot', 'onion',
      'chicken', 'beef', 'pork', 'fish', 'milk', 'cheese', 'yogurt',
      'bread', 'pasta', 'rice', 'egg', 'butter', 'oil', 'sauce'
    ]);

    const foodItems = Array.from(labels).filter(label => 
      Array.from(foodKeywords).some(keyword => label.includes(keyword))
    );

    return foodItems;

  } catch (error) {
    console.error('Error calling Google Vision API:', error);
    throw new Error('Failed to detect ingredients from image.');
  }
}

// Main Edge Function handler
Deno.serve(async (req: Request) => {
  console.log('generate-recipes-from-fridge function started');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract request data
    const { imageBase64, ingredients: manualIngredients, latitude, longitude }: FridgePhotoRequest = await req.json();
    
    // 2. Initial validation - only fails if BOTH image and ingredients are missing
    if (!imageBase64 && !manualIngredients) {
      return new Response(
        JSON.stringify({ error: 'Either imageBase64 or ingredients must be provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let detectedIngredients: string[] = [];
    
    // 3. Process ingredients based on what's provided
    if (imageBase64 && manualIngredients) {
      // Case 1: Both image and manual ingredients provided
      const [imageIngredients] = await Promise.all([
        detectIngredientsFromImage(imageBase64)
      ]);
      detectedIngredients = [...new Set([...imageIngredients, ...manualIngredients])];
    } else if (imageBase64) {
      // Case 2: Only image provided
      detectedIngredients = await detectIngredientsFromImage(imageBase64);
    } else if (manualIngredients) {
      // Case 3: Only manual ingredients provided - this is the manual input case
      console.log('Processing manual ingredients:', manualIngredients);
      detectedIngredients = manualIngredients
        .map(ing => ing.trim().toLowerCase())
        .filter(ing => ing.length > 0);
      console.log('Cleaned manual ingredients:', detectedIngredients);
    }

    // 4. Validate that we have at least one valid ingredient
    if (detectedIngredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid ingredients detected' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Final ingredients list:', detectedIngredients);

    // 5. Generate recipes with the ingredients
    const recipes = await generateRecipesFromIngredients(detectedIngredients, latitude, longitude);
    
    return new Response(
      JSON.stringify({
        ingredients: detectedIngredients,
        recipes: recipes,
        savedRecipes: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in generate-recipes-from-fridge:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});