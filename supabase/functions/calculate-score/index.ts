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
  console.log('calculate-score function started');
  console.log('Incoming request URL:', req.url);
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('Supabase client created');
    console.log('SUPABASE_URL in function:', Deno.env.get('SUPABASE_URL'));

    const authHeader = req.headers.get('Authorization');
    console.log('Authorization Header:', authHeader);

    if (!authHeader) {
      return new Response('Authorization header required', { 
        status: 401,
        headers: corsHeaders
      });
    }

    let user: any = null;
    let authError: any = null;

    try {
      const { data, error } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      user = data.user;
      authError = error;
      console.log('Supabase getUser response - User:', user);
      console.log('Supabase getUser response - Error:', authError);
    } catch (e) {
      console.error('Error during supabase.auth.getUser:', e);
      return new Response(JSON.stringify({
        message: 'Failed to get user from auth token',
        error: e instanceof Error ? e.message : String(e),
      }), { 
        status: 500,
        headers: corsHeaders,
      });
    }

    if (authError || !user) {
      console.warn('Authentication failed:', authError || 'No user found');
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders
      });
    }

    let date: string;
    try {
      const { date: requestDate }: CalculateScoreRequest = await req.json();
      date = requestDate;
    } catch (jsonError) {
      console.error('Error parsing request JSON:', jsonError);
      return new Response(JSON.stringify({
        message: 'Invalid JSON in request body',
        error: jsonError instanceof Error ? jsonError.message : String(jsonError),
      }), { 
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response('Valid date in YYYY-MM-DD format is required', { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Get daily summary data
    const dailySummaryUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/get-daily-summary`;
    console.log('Attempting to fetch daily summary from:', `${dailySummaryUrl}?date=${date}`);
    const summaryResponse = await fetch(`${dailySummaryUrl}?date=${date}`, {
      headers: {
        'Authorization': authHeader,
      },
    });
    console.log('Daily summary response status:', summaryResponse.status, summaryResponse.statusText);

    if (!summaryResponse.ok) {
      return new Response(JSON.stringify({
        message: 'Failed to get daily summary',
        status: summaryResponse.status,
        statusText: summaryResponse.statusText,
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    let summary: any;
    try {
      summary = await summaryResponse.json();
      console.log('Summary received by calculate-score:', summary);
    } catch (jsonParseError) {
      const responseText = await summaryResponse.text();
      console.error('Error parsing daily summary JSON:', jsonParseError, 'Response text:', responseText);
      return new Response(JSON.stringify({
        message: 'Failed to parse daily summary response as JSON',
        error: jsonParseError instanceof Error ? jsonParseError.message : String(jsonParseError),
        responseText: responseText,
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    // Check if summary has expected properties
    if (typeof summary.caloriesBurned === 'undefined' || typeof summary.totalCO2e === 'undefined') {
      console.error('Summary is missing expected properties:', summary);
      return new Response(JSON.stringify({
        message: 'Invalid summary data from get-daily-summary',
        receivedSummary: summary, // Include the summary in the error response
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

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
    console.log('Calculated Scores:', { fitnessScore, ecoScore, combinedScore });

    // Save or update daily score
    console.log('Attempting to save daily score with user_id:', user.id, 'for date:', date);
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
    console.error('Error in calculate-score:', error);
    return new Response(JSON.stringify({
      message: 'Internal server error in calculate-score',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }), { 
      status: 500,
      headers: corsHeaders,
    });
  }
});