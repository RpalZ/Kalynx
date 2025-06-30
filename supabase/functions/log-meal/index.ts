import { createClient } from 'npm:@supabase/supabase-js@2';

interface LogMealRequest {
  mealName: string;
  calories?: number;
  protein?: number;
  carbon_impact?: number;
  water_impact?: number;
  detailed_ingredients?: { ingredient: string; amount: string; unit: string }[];
}

interface NutritionixNutrients {
  calories: number;
  protein: number;
}

interface EnvironmentalImpacts {
  carbon_impact: number;
  water_impact: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Max-Age': '86400',
};

async function fetchNutritionixData(query: string, detailedIngredients?: { ingredient: string; amount: string; unit: string }[]): Promise<NutritionixNutrients> {
  const NUTRITIONIX_APP_ID = Deno.env.get('NUTRITIONIX_APP_ID');
  const NUTRITIONIX_API_KEY = Deno.env.get('NUTRITIONIX_API_KEY');

  if (!NUTRITIONIX_APP_ID || !NUTRITIONIX_API_KEY) {
    console.error('Nutritionix API keys not set.');
    return { calories: 0, protein: 0 };
  }

  try {
    let totalCalories = 0;
    let totalProtein = 0;

    if (detailedIngredients && detailedIngredients.length > 0) {
      // Process each ingredient individually for more accurate results
      for (const ing of detailedIngredients) {
        const formattedQuery = `${ing.amount}${ing.unit} ${ing.ingredient}`;
        console.log('Nutritionix Query for ingredient:', formattedQuery);

        const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-app-id': NUTRITIONIX_APP_ID,
            'x-app-key': NUTRITIONIX_API_KEY,
          },
          body: JSON.stringify({ query: formattedQuery }),
        });

        if (!response.ok) {
          console.error('Nutritionix API error for ingredient:', ing.ingredient);
          continue;
        }

        const data = await response.json();
        if (data.foods && Array.isArray(data.foods)) {
          data.foods.forEach((food: any) => {
            totalCalories += food.nf_calories || 0;
            totalProtein += food.nf_protein || 0;
          });
        }
      }
    } else {
      // Use the meal name as a fallback
      console.log('Nutritionix Query for meal:', query);
      const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_API_KEY,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Nutritionix API error:', response.status, errorText);
        return { calories: 0, protein: 0 };
      }

      const data = await response.json();
      if (data.foods && Array.isArray(data.foods)) {
        data.foods.forEach((food: any) => {
          totalCalories += food.nf_calories || 0;
          totalProtein += food.nf_protein || 0;
        });
      }
    }

    return { calories: totalCalories, protein: totalProtein };
  } catch (error) {
    console.error('Error fetching from Nutritionix API:', error);
    return { calories: 0, protein: 0 };
  }
}

async function fetchEnvironmentalImpacts(query: string): Promise<EnvironmentalImpacts> {
  const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

  if (!DEEPSEEK_API_KEY) {
    console.error('DeepSeek API key not set for environmental impact.');
    return { carbon_impact: 0, water_impact: 0 };
  }

  console.log('DeepSeek Environmental Impact Query:', query);
  try {
    const prompt = `Estimate the carbon footprint (in kg CO2) and water usage (in liters) for a meal consisting of: ${query}. Provide only a JSON object with 'carbon_impact' (number, in kg CO2) and 'water_impact' (number, in liters) fields.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an environmental scientist who provides accurate estimates of the environmental impact of food. Respond only with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error for environmental impact:', response.status, errorText);
      return { carbon_impact: 0, water_impact: 0 };
    }

    const data = await response.json();
    console.log('DeepSeek Raw Response:', JSON.stringify(data, null, 2));
    const impactData = JSON.parse(data.choices[0].message.content);
    console.log('DeepSeek Parsed Impact Data:', JSON.stringify(impactData, null, 2));

    return {
      carbon_impact: parseFloat(impactData.carbon_impact) || 0,
      water_impact: parseFloat(impactData.water_impact) || 0,
    };
  } catch (error) {
    console.error('Error fetching environmental impacts from DeepSeek API:', error);
    return { carbon_impact: 0, water_impact: 0 };
  }
}

Deno.serve(async (req: Request) => {
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

    const { mealName, calories, protein, carbon_impact, water_impact, detailed_ingredients }: LogMealRequest = await req.json();

    if (!mealName) {
      return new Response('Meal name is required', {
        status: 400,
        headers: corsHeaders
      });
    }

    let finalCalories = calories || 0;
    let finalProtein = protein || 0;
    let finalCarbonImpact = carbon_impact || 0;
    let finalWaterImpact = water_impact || 0;

    // If calories or protein are not provided, fetch from Nutritionix
    if (typeof calories === 'undefined' || typeof protein === 'undefined') {
      const nutritionData = await fetchNutritionixData(mealName, detailed_ingredients);
      finalCalories = nutritionData.calories;
      finalProtein = nutritionData.protein;
    }

    // If carbon_impact or water_impact are not provided, fetch from DeepSeek
    if (typeof carbon_impact === 'undefined' || typeof water_impact === 'undefined') {
      const environmentalData = await fetchEnvironmentalImpacts(mealName);
      finalCarbonImpact = environmentalData.carbon_impact;
      finalWaterImpact = environmentalData.water_impact;
    }

    // Save meal to database
    const { data: meal, error: dbError } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        name: mealName,
        calories: finalCalories,
        protein: finalProtein,
        carbon_impact: finalCarbonImpact,
        water_impact: finalWaterImpact,
        detailed_ingredients: detailed_ingredients || [],
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response('Failed to save meal', { 
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('[DEBUG] Meal inserted:', meal);

    // Update user_stats table
    // Fetch current stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError) {
      console.error('[DEBUG] Error fetching user_stats:', statsError);
    } else {
      console.log('[DEBUG] Current user_stats:', stats);
    }

    let newStats = {
      user_id: user.id,
      totalco2e: finalCarbonImpact,
      totalwater: finalWaterImpact,
      mealscount: 1,
      caloriesburned: 0,
      workoutscount: 0,
    };

    if (stats) {
      newStats = {
        user_id: user.id,
        totalco2e: (stats.totalco2e || 0) + finalCarbonImpact,
        totalwater: (stats.totalwater || 0) + finalWaterImpact,
        mealscount: (stats.mealscount || 0) + 1,
        caloriesburned: stats.caloriesburned || 0,
        workoutscount: stats.workoutscount || 0,
      };
    }

    console.log('[DEBUG] Upserting user_stats with:', newStats);

    const { error: upsertError } = await supabase
      .from('user_stats')
      .upsert(newStats, { onConflict: ['user_id'] });

    if (upsertError) {
      console.error('[DEBUG] Error upserting user_stats:', upsertError);
    } else {
      console.log('[DEBUG] user_stats upserted successfully');
    }

    return new Response(JSON.stringify(meal), {
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