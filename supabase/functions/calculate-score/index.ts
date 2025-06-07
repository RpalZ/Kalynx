import { createClient } from 'npm:@supabase/supabase-js@2';

interface CalculateScoreRequest {
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

    const { date }: CalculateScoreRequest = await req.json();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response('Valid date in YYYY-MM-DD format is required', { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Get daily summary data
    const summaryResponse = await fetch(`${req.url.replace('/calculate-score', '/get-daily-summary')}?date=${date}`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!summaryResponse.ok) {
      return new Response('Failed to get daily summary', { 
        status: 500,
        headers: corsHeaders
      });
    }

    const summary = await summaryResponse.json();

    // Calculate Fitness Score (0-100)
    // Based on calories burned vs target (500 calories = 100 points)
    const fitnessScore = Math.min(100, Math.round((summary.caloriesBurned / 500) * 100));

    // Calculate Eco Score (0-100)
    // Lower carbon impact = higher score
    // Assuming 2kg CO2e daily is average (50 points), 0kg = 100 points, >4kg = 0 points
    const maxCarbonForFullScore = 4;
    const ecoScore = Math.max(0, Math.min(100, Math.round(100 - (summary.totalCO2e / maxCarbonForFullScore) * 100)));

    // Calculate Combined Score (weighted average)
    const combinedScore = Math.round(fitnessScore * 0.6 + ecoScore * 0.4);

    // Save or update daily score
    const { data: dailyScore, error: scoreError } = await supabase
      .from('daily_scores')
      .upsert({
        user_id: user.id,
        date,
        fitness_score: fitnessScore,
        eco_score: ecoScore,
        combined_score: combinedScore,
      })
      .select()
      .single();

    if (scoreError) {
      console.error('Score save error:', scoreError);
      return new Response('Failed to save daily score', { 
        status: 500,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      ...dailyScore,
      summary,
    }), {
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