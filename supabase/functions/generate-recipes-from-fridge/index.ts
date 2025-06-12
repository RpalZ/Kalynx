import { createClient } from 'npm:@supabase/supabase-js@2';

interface FridgePhotoRequest {
  imageBase64: string;
}

interface Recipe {
  title: string;
  ingredients: string[];
  carbonImpact: number;
  waterImpact: number;
  estimatedCost: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Mock ingredient detection (in production, use Google Cloud Vision or similar)
function detectIngredientsFromImage(imageBase64: string): string[] {
  // This is a mock implementation - in reality, you'd use computer vision
  const commonIngredients = [
    'eggs', 'milk', 'cheese', 'spinach', 'tomatoes', 'onions', 
    'carrots', 'chicken', 'bread', 'butter', 'lettuce', 'bell peppers',
    'mushrooms', 'garlic', 'potatoes', 'rice', 'pasta', 'beans'
  ];
  
  // Return random subset for demo
  const numIngredients = Math.floor(Math.random() * 6) + 3;
  const shuffled = commonIngredients.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numIngredients);
}

// Mock recipe generation (in production, use Spoonacular or Edamam API)
function generateRecipesFromIngredients(ingredients: string[]): Recipe[] {
  const recipeTemplates = [
    {
      title: 'Vegetable Stir Fry',
      ingredients: ['onions', 'bell peppers', 'carrots', 'garlic'],
      baseCarbon: 0.5,
      baseWater: 25,
      baseCost: 3.50
    },
    {
      title: 'Scrambled Eggs with Vegetables',
      ingredients: ['eggs', 'spinach', 'tomatoes', 'cheese'],
      baseCarbon: 1.2,
      baseWater: 45,
      baseCost: 4.00
    },
    {
      title: 'Chicken and Rice Bowl',
      ingredients: ['chicken', 'rice', 'onions', 'carrots'],
      baseCarbon: 2.1,
      baseWater: 85,
      baseCost: 6.50
    },
    {
      title: 'Pasta Primavera',
      ingredients: ['pasta', 'bell peppers', 'mushrooms', 'tomatoes'],
      baseCarbon: 0.8,
      baseWater: 35,
      baseCost: 4.25
    },
    {
      title: 'Bean and Vegetable Soup',
      ingredients: ['beans', 'carrots', 'onions', 'garlic'],
      baseCarbon: 0.4,
      baseWater: 20,
      baseCost: 2.75
    }
  ];

  // Find recipes that can be made with available ingredients
  const possibleRecipes = recipeTemplates.filter(template => {
    const availableIngredients = template.ingredients.filter(ingredient => 
      ingredients.some(available => available.toLowerCase().includes(ingredient.toLowerCase()))
    );
    return availableIngredients.length >= 2; // Need at least 2 matching ingredients
  });

  // Return up to 3 recipes
  return possibleRecipes.slice(0, 3).map(template => ({
    title: template.title,
    ingredients: template.ingredients.filter(ingredient => 
      ingredients.some(available => available.toLowerCase().includes(ingredient.toLowerCase()))
    ),
    carbonImpact: template.baseCarbon,
    waterImpact: template.baseWater,
    estimatedCost: template.baseCost
  }));
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

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

    const { imageBase64 }: FridgePhotoRequest = await req.json();

    if (!imageBase64) {
      return new Response('Image data is required', { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Step 1: Extract ingredients from fridge photo
    const detectedIngredients = detectIngredientsFromImage(imageBase64);

    // Step 2: Generate recipes based on ingredients
    const generatedRecipes = generateRecipesFromIngredients(detectedIngredients);

    // Step 3: Save recipes to database
    const savedRecipes = [];
    for (const recipe of generatedRecipes) {
      const { data: savedRecipe, error: saveError } = await supabase
        .from('recipes_generated')
        .insert({
          user_id: user.id,
          source: 'fridge',
          title: recipe.title,
          ingredients: recipe.ingredients,
          estimated_cost: recipe.estimatedCost,
          carbon_impact: recipe.carbonImpact,
          water_impact: recipe.waterImpact,
        })
        .select()
        .single();

      if (!saveError) {
        savedRecipes.push(savedRecipe);
      }
    }

    const result = {
      ingredients: detectedIngredients,
      recipes: generatedRecipes,
      savedRecipes: savedRecipes,
    };

    return new Response(JSON.stringify(result), {
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