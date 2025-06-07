import { createClient } from 'npm:@supabase/supabase-js@2';

interface LogMealRequest {
  mealName: string;
}

interface NutritionixResponse {
  foods: Array<{
    food_name: string;
    nf_calories: number;
    nf_protein: number;
  }>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

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

    const { mealName }: LogMealRequest = await req.json();

    if (!mealName) {
      return new Response('Meal name is required', { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Get nutrition data from Nutritionix API
    let calories = 0;
    let protein = 0;

    try {
      const nutritionixAppId = Deno.env.get('NUTRITIONIX_APP_ID') || 'demo_app_id';
      const nutritionixApiKey = Deno.env.get('NUTRITIONIX_API_KEY') || 'demo_api_key';
      console.log('Using Nutritionix App ID:', nutritionixAppId);
      console.log('Using Nutritionix API Key (first 5 chars): ', nutritionixApiKey.substring(0, 5) + '...');

      const nutritionixResponse = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': nutritionixAppId,
          'x-app-key': nutritionixApiKey,
        },
        body: JSON.stringify({
          query: mealName,
        }),
      });

      if (nutritionixResponse.ok) {
        const nutritionData: NutritionixResponse = await nutritionixResponse.json();
        console.log('Nutritionix API response:', nutritionData);
        if (nutritionData.foods && nutritionData.foods.length > 0) {
          calories = nutritionData.foods[0].nf_calories || 0;
          protein = nutritionData.foods[0].nf_protein || 0;
        }
      } else {
        const errorText = await nutritionixResponse.text();
        console.error('Nutritionix API responded with an error:', nutritionixResponse.status, errorText);
      }
    } catch (error) {
      console.warn('Nutritionix API request error:', error);
      // Use default values if API fails or request error
      calories = 250; // Default estimate
      protein = 10; // Default estimate
    }

    // Calculate environmental impact (simplified estimates)
    const carbonImpact = calories * 0.002; // kg CO2e per calorie (rough estimate)
    const waterImpact = calories * 0.5; // liters per calorie (rough estimate)

    // Save meal to database
    const { data: meal, error: dbError } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        name: mealName,
        calories,
        protein,
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