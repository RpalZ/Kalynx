import { createClient } from 'npm:@supabase/supabase-js@2';

interface DailySummaryRequest {
  date: string; // YYYY-MM-DD format
}

// Define baseline average environmental impacts per meal
// These are rough estimates for a "typical" meal and can be adjusted
const AVERAGE_CARBON_IMPACT_PER_MEAL = 2.0; // kg CO2e
const AVERAGE_WATER_IMPACT_PER_MEAL = 500; // liters

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

    const url = new URL(req.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response('Invalid date format. Use YYYY-MM-DD', { 
        status: 400,
        headers: corsHeaders
      });
    }

    const startOfDay = `${date} 00:00:00.000000+00`;
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const startOfNextDay = `${nextDay.toISOString().split('T')[0]} 00:00:00.000000+00`;

    console.log('Fetching summary for user_id:', user.id, 'for date range:', { date, startOfDay, startOfNextDay });

    console.log('Attempting to fetch meals for user_id:', user.id);
    // Get meals for the day
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startOfDay)
      .lt('created_at', startOfNextDay);

    if (mealsError) {
      console.error('Meals error:', mealsError);
      return new Response('Failed to fetch meals', { 
        status: 500,
        headers: corsHeaders
      });
    }
    console.log('Meals fetched:', meals?.length, 'First meal created_at:', meals?.[0]?.created_at);

    // Get workouts for the day
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startOfDay)
      .lt('created_at', startOfNextDay);

    if (workoutsError) {
      console.error('Workouts error:', workoutsError);
      return new Response('Failed to fetch workouts', { 
        status: 500,
        headers: corsHeaders
      });
    }
    console.log('Workouts fetched:', workouts?.length, 'First workout created_at:', workouts?.[0]?.created_at);

    // Calculate totals
    const totalCalories = meals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0;
    const totalProtein = meals?.reduce((sum, meal) => sum + (meal.protein || 0), 0) || 0;
    const totalCO2e = meals?.reduce((sum, meal) => sum + (meal.carbon_impact || 0), 0) || 0;
    const totalWater = meals?.reduce((sum, meal) => sum + (meal.water_impact || 0), 0) || 0;
    const caloriesBurned = workouts?.reduce((sum, workout) => sum + (workout.calories_burned || 0), 0) || 0;

    // Calculate environmental savings based on defined baselines
    const totalCarbonSaved = meals?.reduce((sum, meal) =>
      sum + (AVERAGE_CARBON_IMPACT_PER_MEAL - (meal.carbon_impact || 0)), 0
    ) || 0;

    const totalWaterSaved = meals?.reduce((sum, meal) =>
      sum + (AVERAGE_WATER_IMPACT_PER_MEAL - (meal.water_impact || 0)), 0
    ) || 0;

    const summary = {
      date,
      totalCalories,
      totalProtein,
      totalCO2e,
      totalWater,
      caloriesBurned,
      netCalories: totalCalories - caloriesBurned,
      mealsCount: meals?.length || 0,
      workoutsCount: workouts?.length || 0,
      meals: meals || [],
      workouts: workouts || [],
      totalCarbonSaved: parseFloat(totalCarbonSaved.toFixed(2)), // Format to 2 decimal places
      totalWaterSaved: parseFloat(totalWaterSaved.toFixed(2)),   // Format to 2 decimal places
    };

    return new Response(JSON.stringify(summary), {
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