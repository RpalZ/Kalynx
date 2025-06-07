import { createClient } from 'npm:@supabase/supabase-js@2';

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

    // Get date range for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get leaderboard data
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('daily_scores')
      .select(`
        user_id,
        combined_score,
        fitness_score,
        eco_score,
        users!inner(name, email)
      `)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('combined_score', { ascending: false });

    if (leaderboardError) {
      console.error('Leaderboard error:', leaderboardError);
      return new Response('Failed to fetch leaderboard', { 
        status: 500,
        headers: corsHeaders
      });
    }

    // Aggregate scores by user (average over the 7-day period)
    const userScores = new Map();
    
    leaderboardData?.forEach((entry: any) => {
      const userId = entry.user_id;
      const userName = entry.users.name;
      const userEmail = entry.users.email;
      
      if (!userScores.has(userId)) {
        userScores.set(userId, {
          user_id: userId,
          name: userName,
          email: userEmail,
          combined_scores: [],
          fitness_scores: [],
          eco_scores: [],
        });
      }
      
      const userData = userScores.get(userId);
      userData.combined_scores.push(entry.combined_score || 0);
      userData.fitness_scores.push(entry.fitness_score || 0);
      userData.eco_scores.push(entry.eco_score || 0);
    });

    // Calculate averages and create leaderboard
    const leaderboard = Array.from(userScores.values()).map((userData: any) => {
      const avgCombined = userData.combined_scores.reduce((a: number, b: number) => a + b, 0) / userData.combined_scores.length;
      const avgFitness = userData.fitness_scores.reduce((a: number, b: number) => a + b, 0) / userData.fitness_scores.length;
      const avgEco = userData.eco_scores.reduce((a: number, b: number) => a + b, 0) / userData.eco_scores.length;
      
      return {
        user_id: userData.user_id,
        name: userData.name,
        email: userData.email,
        avg_combined_score: Math.round(avgCombined),
        avg_fitness_score: Math.round(avgFitness),
        avg_eco_score: Math.round(avgEco),
        days_active: userData.combined_scores.length,
      };
    });

    // Sort by average combined score and take top 10
    leaderboard.sort((a, b) => b.avg_combined_score - a.avg_combined_score);
    const top10 = leaderboard.slice(0, 10);

    // Add ranking
    const rankedLeaderboard = top10.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return new Response(JSON.stringify({
      leaderboard: rankedLeaderboard,
      period: {
        start_date: startDateStr,
        end_date: endDateStr,
        days: 7,
      },
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