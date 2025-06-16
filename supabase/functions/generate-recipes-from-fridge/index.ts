import { createClient } from 'npm:@supabase/supabase-js@2';
import { ImageAnnotatorClient } from 'npm:@google-cloud/vision'; // For Google Cloud Vision

interface FridgePhotoRequest {
  imageBase64: string;
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

// Mock ingredient detection (in production, use Google Cloud Vision or similar)
async function detectIngredientsFromImage(imageBase64: string): Promise<string[]> {
  const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY');

  if (!GOOGLE_VISION_API_KEY) {
    console.error('Google Vision API key not set.');
    throw new Error('Google Vision API key is missing.');
  }

  try {
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
                content: imageBase64
              },
              features: [
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 10
                },
                {
                  type: 'OBJECT_LOCALIZATION',
                  maxResults: 10
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

    // Extract labels from both label detection and object localization
    if (data.responses?.[0]?.labelAnnotations) {
      data.responses[0].labelAnnotations.forEach((label: any) => {
        if (label.description) {
          labels.add(label.description.toLowerCase());
        }
      });
    }

    if (data.responses?.[0]?.localizedObjectAnnotations) {
      data.responses[0].localizedObjectAnnotations.forEach((object: any) => {
        if (object.name) {
          labels.add(object.name.toLowerCase());
        }
      });
    }

    // Filter for food-related items
    const foodKeywords = [
      'food', 'fruit', 'vegetable', 'meat', 'dairy', 'drink', 'beverage',
      'apple', 'banana', 'orange', 'tomato', 'potato', 'carrot', 'onion',
      'chicken', 'beef', 'pork', 'fish', 'milk', 'cheese', 'yogurt',
      'bread', 'pasta', 'rice', 'egg', 'butter', 'oil', 'sauce'
    ];

    const foodItems = Array.from(labels).filter(label => 
      foodKeywords.some(keyword => label.includes(keyword))
    );

    if (foodItems.length === 0) {
      console.warn('No food items detected in the image.');
      return [];
    }

    return foodItems;

  } catch (error) {
    console.error('Error calling Google Vision API:', error);
    throw new Error('Failed to detect ingredients from image.');
  }
}

// Mock recipe generation (in production, use Spoonacular or Edamam API)
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

  const messages = [
    { role: 'system', content: `You are a helpful assistant that generates healthy, sustainable, and cost-effective recipes based on a list of ingredients. For each recipe, provide the title, a list of ingredients, estimated carbon impact (in kg CO2e), estimated water impact (in liters), estimated cost (in USD), total calories, total protein (in grams), and a detailed list of ingredients including their specific amounts and units. The detailed ingredients should be a JSON array of objects with 'ingredient', 'amount', and 'unit' fields. The carbon impact, water impact, estimated cost, calories, and protein should be numerical values. The recipe should be suitable for a general audience. If an ingredient is missing, try to suggest a common substitute or indicate it's optional. Focus on providing recipes that are quick to prepare and healthy. Ensure all responses are JSON objects.

Example JSON response format:
[
  {
    "title": "Quick Veggie Stir-Fry",
    "ingredients": ["broccoli", "carrot", "soy sauce"],
    "carbon_impact": 0.5,
    "water_impact": 100,
    "estimated_cost": 5.25,
    "calories": 350,
    "protein": 15,
    "detailed_ingredients": [
      { "ingredient": "broccoli florets", "amount": "2", "unit": "cups" },
      { "ingredient": "carrots", "amount": "1", "unit": "cup" },
      { "ingredient": "soy sauce", "amount": "2", "unit": "tbsp" }
    ]
  }
]` },
    { role: 'user', content: `Generate 3 recipes using these ingredients: ${ingredients.join(', ')}. Latitude: ${latitude}, Longitude: ${longitude}` },
  ];

  try {
    console.log('Sending request to DeepSeek API with messages:', messages);
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.7,
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

    const recipesPromises: Promise<Recipe>[] = recipesData.recipes.map(async (recipe: any) => ({
      title: recipe.title,
      ingredients: recipe.ingredients,
      estimated_cost: await calculateRecipeCost(recipe.ingredients, latitude, longitude), 
      carbon_impact: recipe.carbon_impact,
      water_impact: recipe.water_impact,
      calories: recipe.calories,
      protein: recipe.protein,
      detailed_ingredients: recipe.detailed_ingredients || [],
      created_at: new Date().toISOString(),
    }));

    const generatedRecipes: Recipe[] = await Promise.all(recipesPromises);

    console.log('Generated recipes with estimated costs (before sending to client):', generatedRecipes.map(r => ({ title: r.title, estimated_cost: r.estimated_cost })));

    const recipeObjects: Recipe[] = generatedRecipes.map((recipe: any) => ({
      title: recipe.title,
      ingredients: recipe.ingredients,
      carbon_impact: recipe.carbon_impact,
      water_impact: recipe.water_impact,
      estimated_cost: recipe.estimated_cost, // This will be the AI-generated cost for now
      calories: recipe.calories,
      protein: recipe.protein,
      detailed_ingredients: recipe.detailed_ingredients || [], // Ensure it's an array
    }));

    // After receiving AI-generated recipes, recalculate estimated_cost
    // This ensures consistency with our internal pricing database
    const recipesWithAccurateCost: Recipe[] = await Promise.all(
      recipeObjects.map(async (recipe) => {
        const accurateCost = await calculateRecipeCost(recipe.ingredients, latitude, longitude);
        return { ...recipe, estimated_cost: accurateCost };
      })
    );

    console.log('Generated recipes with accurate cost:', recipesWithAccurateCost);
    return recipesWithAccurateCost;

  } catch (error) {
    console.error('Error generating recipes:', error);
    throw error;
  }
}

// Main Edge Function handler
Deno.serve(async (req: Request) => {
  console.log('generate-recipes-from-fridge function started');
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Authorization header required', { 
        status: 401,
        headers: corsHeaders
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders
      });
    }

    const { imageBase64, latitude, longitude }: FridgePhotoRequest = await req.json();

    if (!imageBase64) {
      return new Response('Image data is required', { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Step 1: Extract ingredients from fridge photo
    const detectedIngredients = await detectIngredientsFromImage(imageBase64);

    if (detectedIngredients.length === 0) {
      return new Response(JSON.stringify({
        ingredients: [],
        recipes: [],
        savedRecipes: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Generate recipes based on ingredients (now with location data)
    const generatedRecipes = await generateRecipesFromIngredients(
      detectedIngredients,
      latitude,
      longitude
    );

    // Step 3: Fetch user's saved recipes for comparison or display
    const { data: savedRecipes, error: savedRecipesError } = await supabase
      .from('recipes_generated')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (savedRecipesError) {
      console.error('Error fetching saved recipes:', savedRecipesError);
    }

    return new Response(JSON.stringify({
      ingredients: detectedIngredients,
      recipes: generatedRecipes,
      savedRecipes: savedRecipes || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders
    });
  }
});