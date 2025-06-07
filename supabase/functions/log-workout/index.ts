import { createClient } from 'npm:@supabase/supabase-js@2';

interface LogWorkoutRequest {
  workoutType: string;
  duration: number; // in minutes
}

// MET values for different workout types
const MET_VALUES: { [key: string]: number } = {
  running: 8.0,
  walking: 3.5,
  cycling: 6.0,
  swimming: 6.0,
  weights: 3.0,
  yoga: 2.5,
  hiking: 6.0,
  basketball: 6.5,
  tennis: 7.0,
  dancing: 4.5,
  default: 4.0,
};

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

    const { workoutType, duration }: LogWorkoutRequest = await req.json();

    if (!workoutType || !duration || duration <= 0) {
      return new Response('Valid workout type and duration are required', { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Calculate calories burned using MET values
    // Formula: Calories = MET × weight (kg) × time (hours)
    // Using average weight of 70kg for estimation
    const averageWeightKg = 70;
    const metValue = MET_VALUES[workoutType.toLowerCase()] || MET_VALUES.default;
    const timeInHours = duration / 60;
    const caloriesBurned = Math.round(metValue * averageWeightKg * timeInHours);

    // Save workout to database
    const { data: workout, error: dbError } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        type: workoutType,
        duration,
        calories_burned: caloriesBurned,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response('Failed to save workout', { 
        status: 500,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify(workout), {
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