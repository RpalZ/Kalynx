import { createClient } from 'npm:@supabase/supabase-js@2';

interface UpdateWorkoutRequest {
  workoutId: string;
  type?: string;
  duration?: number;
  calories_burned?: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  console.log('🚀 update-workout function started');
  console.log('📝 Request method:', req.method);
  console.log('🌐 Request URL:', req.url);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔧 Supabase client created');

    const authHeader = req.headers.get('Authorization');
    console.log('🔑 Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return new Response('Authorization header required', { 
        status: 401,
        headers: corsHeaders
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    console.log('👤 User authenticated:', !!user);
    console.log('🚫 Auth error:', authError);

    if (authError || !user) {
      console.log('❌ Authentication failed');
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders
      });
    }

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📦 Request body:', JSON.stringify(requestBody));
    } catch (parseError) {
      console.log('❌ Failed to parse request body:', parseError);
      return new Response('Invalid JSON in request body', {
        status: 400,
        headers: corsHeaders
      });
    }

    const { 
      workoutId, 
      type, 
      duration, 
      calories_burned 
    }: UpdateWorkoutRequest = requestBody;

    console.log('🏋️ Workout ID to update:', workoutId);

    if (!workoutId) {
      console.log('❌ No workout ID provided');
      return new Response('Workout ID is required', {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate that the workout belongs to the authenticated user
    console.log('🔍 Checking if workout exists and belongs to user...');
    const { data: existingWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select('user_id')
      .eq('id', workoutId)
      .single();

    console.log('📋 Existing workout found:', !!existingWorkout);
    console.log('🚫 Fetch error:', fetchError);

    if (fetchError || !existingWorkout) {
      console.log('❌ Workout not found');
      return new Response('Workout not found', {
        status: 404,
        headers: corsHeaders
      });
    }

    if (existingWorkout.user_id !== user.id) {
      console.log('❌ User does not own this workout');
      return new Response('Unauthorized to update this workout', {
        status: 403,
        headers: corsHeaders
      });
    }

    console.log('✅ User owns the workout, proceeding with update...');

    // Prepare update object with only provided fields
    const updateData: any = {};
    
    if (type !== undefined) {
      if (!type.trim()) {
        console.log('❌ Empty workout type provided');
        return new Response('Workout type cannot be empty', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.type = type.trim();
      console.log('📝 Updating type to:', updateData.type);
    }
    
    if (duration !== undefined) {
      if (duration <= 0) {
        console.log('❌ Invalid duration provided');
        return new Response('Duration must be positive', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.duration = Number(duration);
      console.log('⏱️ Updating duration to:', updateData.duration);
    }
    
    if (calories_burned !== undefined) {
      if (calories_burned < 0) {
        console.log('❌ Negative calories burned provided');
        return new Response('Calories burned cannot be negative', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.calories_burned = Number(calories_burned);
      console.log('🔥 Updating calories burned to:', updateData.calories_burned);
    }

    console.log('📊 Final update data:', JSON.stringify(updateData));

    // Update the workout in the database
    const { data: updatedWorkout, error: updateError } = await supabase
      .from('workouts')
      .update(updateData)
      .eq('id', workoutId)
      .eq('user_id', user.id) // Double-check ownership
      .select()
      .single();

    console.log('🔄 Update operation completed');
    console.log('🚫 Update error:', updateError);
    console.log('📋 Updated workout:', updatedWorkout);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      return new Response('Failed to update workout', { 
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('✅ Workout updated successfully');

    return new Response(JSON.stringify(updatedWorkout), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in update-workout function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});