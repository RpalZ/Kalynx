import { createClient } from 'npm:@supabase/supabase-js@2';

interface LogMealRequest {
  mealName: string;
  ingredients: string[];
}

interface NutritionixResponse {
  foods: Array<{
    food_name: string;
    nf_calories: number;
    nf_protein: number;
    nf_total_carbohydrate: number;
    nf_total_fat: number;
    nf_saturated_fat: number;
    nf_cholesterol: number;
    nf_sodium: number;
    nf_sugars: number;
    nf_dietary_fiber: number;
    nf_potassium: number;
  }>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Max-Age': '86400',
};

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

    const { mealName, ingredients }: LogMealRequest = await req.json();

    if (!mealName || !ingredients || ingredients.length === 0) {
      return new Response('Meal name and ingredients are required', { 
        status: 400,
        headers: corsHeaders
      });
    }

    let totalCalories = 0;
    let totalProtein = 0;
    const nutritionixAppId = Deno.env.get('NUTRITIONIX_APP_ID') || 'demo_app_id';
    const nutritionixApiKey = Deno.env.get('NUTRITIONIX_API_KEY') || 'demo_api_key';

    for (const ingredient of ingredients) {
      try {
        const nutritionixResponse = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-app-id': nutritionixAppId,
            'x-app-key': nutritionixApiKey,
          },
          body: JSON.stringify({
            query: ingredient,
          }),
        });

        if (nutritionixResponse.ok) {
          const nutritionData: NutritionixResponse = await nutritionixResponse.json();
          if (nutritionData.foods && nutritionData.foods.length > 0) {
            totalCalories += nutritionData.foods[0].nf_calories || 0;
            totalProtein += nutritionData.foods[0].nf_protein || 0;
          }
        } else {
          const errorText = await nutritionixResponse.text();
          console.error(`Nutritionix API for ingredient \'${ingredient}\' responded with an error:`, nutritionixResponse.status, errorText);
        }
      } catch (error) {
        console.warn(`Nutritionix API request error for ingredient \'${ingredient}\' :`, error);
      }
    }

    // Calculate environmental impact (simplified estimates based on total calories)
    const carbonImpact = totalCalories * 0.002; // kg CO2e per calorie (rough estimate)
    const waterImpact = totalCalories * 0.5; // liters per calorie (rough estimate)

    // Save meal to database
    const { data: meal, error: dbError } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        name: mealName,
        calories: totalCalories,
        protein: totalProtein,
        carbon_impact: carbonImpact,
        water_impact: waterImpact,
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