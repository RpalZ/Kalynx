import { createClient } from 'npm:@supabase/supabase-js@2';

interface DeleteWorkoutRequest {
  workoutId: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  console.log('🚀 delete-workout function started');
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

    const { workoutId }: DeleteWorkoutRequest = requestBody;
    console.log('🏋️ Workout ID to delete:', workoutId);

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
      .select('user_id, type')
      .eq('id', workoutId)
      .single();

    console.log('📋 Existing workout found:', !!existingWorkout);
    console.log('🚫 Fetch error:', fetchError);

    if (fetchError) {
      console.log('❌ Database fetch error:', fetchError);
      return new Response('Workout not found', {
        status: 404,
        headers: corsHeaders
      });
    }

    if (!existingWorkout) {
      console.log('❌ No workout found with ID:', workoutId);
      return new Response('Workout not found', {
        status: 404,
        headers: corsHeaders
      });
    }

    if (existingWorkout.user_id !== user.id) {
      console.log('❌ User does not own this workout');
      console.log('🔍 Workout owner:', existingWorkout.user_id);
      console.log('🔍 Current user:', user.id);
      return new Response('Unauthorized to delete this workout', {
        status: 403,
        headers: corsHeaders
      });
    }

    console.log('✅ User owns the workout, proceeding with deletion...');

    // Delete the workout from the database
    const { error: deleteError } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId)
      .eq('user_id', user.id); // Double-check ownership

    console.log('🗑️ Delete operation completed');
    console.log('🚫 Delete error:', deleteError);

    if (deleteError) {
      console.error('❌ Database delete error:', deleteError);
      return new Response('Failed to delete workout', { 
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('✅ Workout deleted successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Workout deleted successfully',
      deletedWorkoutId: workoutId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in delete-workout function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});