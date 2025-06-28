import { createClient } from 'npm:@supabase/supabase-js@2';

interface DeleteMealRequest {
  mealId: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req: Request) => {
  console.log('delete-meal function started');
  
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
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      return new Response('Authorization header required', { 
        status: 401,
        headers: corsHeaders
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    console.log('User authenticated:', !!user, 'Auth error:', authError);

    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders
      });
    }

    const { mealId }: DeleteMealRequest = await req.json();
    console.log('Meal ID to delete:', mealId);

    if (!mealId) {
      return new Response('Meal ID is required', {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate that the meal belongs to the authenticated user
    const { data: existingMeal, error: fetchError } = await supabase
      .from('meals')
      .select('user_id, name')
      .eq('id', mealId)
      .single();

    console.log('Existing meal found:', !!existingMeal, 'Fetch error:', fetchError);

    if (fetchError || !existingMeal) {
      return new Response('Meal not found', {
        status: 404,
        headers: corsHeaders
      });
    }

    if (existingMeal.user_id !== user.id) {
      return new Response('Unauthorized to delete this meal', {
        status: 403,
        headers: corsHeaders
      });
    }

    // Delete the meal from the database
    const { error: deleteError } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)
      .eq('user_id', user.id); // Double-check ownership

    console.log('Delete operation completed, error:', deleteError);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return new Response('Failed to delete meal', { 
        status: 500,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Meal deleted successfully',
      deletedMealId: mealId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in delete-meal function:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders
    });
  }
});