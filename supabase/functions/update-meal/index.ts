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

    const { 
      mealId, 
      name, 
      calories, 
      protein, 
      carbon_impact, 
      water_impact, 
      detailed_ingredients 
    }: UpdateMealRequest = await req.json();

    if (!mealId) {
      return new Response('Meal ID is required', {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate that the meal belongs to the authenticated user
    const { data: existingMeal, error: fetchError } = await supabase
      .from('meals')
      .select('user_id')
      .eq('id', mealId)
      .single();

    if (fetchError || !existingMeal) {
      return new Response('Meal not found', {
        status: 404,
        headers: corsHeaders
      });
    }

    if (existingMeal.user_id !== user.id) {
      return new Response('Unauthorized to update this meal', {
        status: 403,
        headers: corsHeaders
      });
    }

    // Prepare update object with only provided fields
    const updateData: any = {};
    
    if (name !== undefined) {
      if (!name.trim()) {
        return new Response('Meal name cannot be empty', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.name = name.trim();
    }
    
    if (calories !== undefined) {
      if (calories < 0) {
        return new Response('Calories cannot be negative', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.calories = Number(calories);
    }
    
    if (protein !== undefined) {
      if (protein < 0) {
        return new Response('Protein cannot be negative', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.protein = Number(protein);
    }
    
    if (carbon_impact !== undefined) {
      if (carbon_impact < 0) {
        return new Response('Carbon impact cannot be negative', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.carbon_impact = Number(carbon_impact);
    }
    
    if (water_impact !== undefined) {
      if (water_impact < 0) {
        return new Response('Water impact cannot be negative', {
          status: 400,
          headers: corsHeaders
        });
      }
      updateData.water_impact = Number(water_impact);
    }
    
    if (detailed_ingredients !== undefined) {
      updateData.detailed_ingredients = detailed_ingredients;
    }

    // Update the meal in the database
    const { data: updatedMeal, error: updateError } = await supabase
      .from('meals')
      .update(updateData)
      .eq('id', mealId)
      .eq('user_id', user.id) // Double-check ownership
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return new Response('Failed to update meal', { 
        status: 500,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify(updatedMeal), {
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