import { createClient } from 'npm:@supabase/supabase-js@2';

interface UpdateMealRequest {
  mealId: string;
  name?: string;
  calories?: number;
  protein?: number;
  carbon_impact?: number;
  water_impact?: number;
  detailed_ingredients?: { ingredient: string; amount: string; unit: string }[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  console.log('🚀 update-meal function started');
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
      mealId, 
      name, 
      calories, 
      protein, 
      carbon_impact, 
      water_impact, 
      detailed_ingredients 
    }: UpdateMealRequest = requestBody;

    console.log('🍽️ Meal ID to update:', mealId);

    if (!mealId) {
      console.log('❌ No meal ID provided');
      return new Response('Meal ID is required', {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate that the meal belongs to the authenticated user
    console.log('🔍 Checking if meal exists and belongs to user...');
    const { data: existingMeal, error: fetchError } = await supabase
      .from('meals')
      .select('user_id')
      .eq('id', mealId)
      .single();

    console.log('📋 Existing meal found:', !!existingMeal);
    console.log('🚫 Fetch error:', fetchError);

    if (fetchError || !existingMeal) {
      console.log('❌ Meal not found');
      return new Response('Meal not found', {
        status: 404,
        headers: corsHeaders
      });
    }

    if (existingMeal.user_id !== user.id) {
      console.log('❌ User does not own this meal');
      return new Response('Unauthorized to update this meal', {
        status: 403,
        headers: corsHeaders
      });
    }

    console.log('✅ User owns the meal, proceeding with update...');

    // Prepare update object with only provided fields
    const updateData: any = {};
    
    if (name !== undefined) {
      if (!name.trim()) {
        console.log('❌ Empty meal name provided');
        return new Response('Meal name cannot be empty', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.name = name.trim();
      console.log('📝 Updating name to:', updateData.name);
    }
    
    if (calories !== undefined) {
      if (calories < 0) {
        console.log('❌ Negative calories provided');
        return new Response('Calories cannot be negative', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.calories = Number(calories);
      console.log('🔥 Updating calories to:', updateData.calories);
    }
    
    if (protein !== undefined) {
      if (protein < 0) {
        console.log('❌ Negative protein provided');
        return new Response('Protein cannot be negative', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.protein = Number(protein);
      console.log('💪 Updating protein to:', updateData.protein);
    }
    
    if (carbon_impact !== undefined) {
      if (carbon_impact < 0) {
        console.log('❌ Negative carbon impact provided');
        return new Response('Carbon impact cannot be negative', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.carbon_impact = Number(carbon_impact);
      console.log('🌱 Updating carbon impact to:', updateData.carbon_impact);
    }
    
    if (water_impact !== undefined) {
      if (water_impact < 0) {
        console.log('❌ Negative water impact provided');
        return new Response('Water impact cannot be negative', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.water_impact = Number(water_impact);
      console.log('💧 Updating water impact to:', updateData.water_impact);
    }
    
    if (detailed_ingredients !== undefined) {
      updateData.detailed_ingredients = detailed_ingredients;
      console.log('🥗 Updating detailed ingredients');
    }

    console.log('📊 Final update data:', JSON.stringify(updateData));

    // Update the meal in the database
    const { data: updatedMeal, error: updateError } = await supabase
      .from('meals')
      .update(updateData)
      .eq('id', mealId)
      .eq('user_id', user.id) // Double-check ownership
      .select()
      .single();

    console.log('🔄 Update operation completed');
    console.log('🚫 Update error:', updateError);
    console.log('📋 Updated meal:', updatedMeal);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      return new Response('Failed to update meal', { 
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('✅ Meal updated successfully');

    return new Response(JSON.stringify(updatedMeal), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in update-meal function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});