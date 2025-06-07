import { createClient } from 'npm:@supabase/supabase-js@2';

interface DailySummaryRequest {
  date: string; // YYYY-MM-DD format
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

    // Get meals for the day
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`);

    if (mealsError) {
      console.error('Meals error:', mealsError);
      return new Response('Failed to fetch meals', { 
        status: 500,
        headers: corsHeaders
      });
    }

    // Get workouts for the day
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`);

    if (workoutsError) {
      console.error('Workouts error:', workoutsError);
      return new Response('Failed to fetch workouts', { 
        status: 500,
        headers: corsHeaders
      });
    }

    // Calculate totals
    const totalCalories = meals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0;
    const totalProtein = meals?.reduce((sum, meal) => sum + (meal.protein || 0), 0) || 0;
    const totalCO2e = meals?.reduce((sum, meal) => sum + (meal.carbon_impact || 0), 0) || 0;
    const totalWater = meals?.reduce((sum, meal) => sum + (meal.water_impact || 0), 0) || 0;
    const caloriesBurned = workouts?.reduce((sum, workout) => sum + (workout.calories_burned || 0), 0) || 0;

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