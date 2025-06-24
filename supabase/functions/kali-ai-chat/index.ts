import { createClient } from 'npm:@supabase/supabase-js@2';

interface ChatRequest {
  userMessage: string;
  context: Array<{ role: string; content: string }>;
  userStats?: {
    totalCO2e: number;
    totalWater: number;
    mealsCount: number;
    workoutsCount: number;
    caloriesBurned: number;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Remove userStats from request body and always fetch from DB
    // const { userMessage, context, userStats }: ChatRequest = await req.json();
    const { userMessage, context }: { userMessage: string; context: Array<{ role: string; content: string }> } = await req.json();

    if (!userMessage) {
      return new Response('User message is required', {
        status: 400,
        headers: corsHeaders
      });
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

    if (!DEEPSEEK_API_KEY) {
      console.error('DeepSeek API key not set.');
      return new Response('AI service temporarily unavailable', {
        status: 503,
        headers: corsHeaders
      });
    }

    // Fetch user stats from DB
    let userStats = null;
    try {
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('totalCO2e, totalWater, mealsCount, workoutsCount, caloriesBurned')
        .eq('user_id', user.id)
        .single();
      if (!statsError && stats) {
        userStats = stats;
      }
    } catch (e) {
      // If stats fetch fails, just leave userStats as null
    }

    // Build system prompt with user context
    let systemPrompt = `You are KaliAI, a friendly and knowledgeable virtual assistant focused on sustainability and fitness. You help users make eco-friendly choices and maintain healthy lifestyles.

Your personality:
- Supportive and encouraging
- Knowledgeable about environmental impact and fitness
- Practical and actionable in your advice
- Enthusiastic about sustainable living

You can perform system actions by including special commands in your response:
- [SYSTEM:navigate:/leaderboard] - Navigate to leaderboard page
- [SYSTEM:navigate:/meals] - Navigate to meals page  
- [SYSTEM:navigate:/workouts] - Navigate to workouts page
- [SYSTEM:navigate:/camera] - Navigate to camera/fridge scan page
- [SYSTEM:component:stats] - Display user's weekly stats component
- [SYSTEM:component:tips] - Display sustainability tips component

Guidelines:
- Keep responses conversational and helpful
- Reference user's actual data when giving advice
- Suggest specific, actionable steps
- Use system commands when users ask to see pages or data
- Be encouraging about their progress`;

    if (userStats) {
      systemPrompt += `

Current user data this week:
- Meals logged: ${userStats.mealsCount}
- Workouts completed: ${userStats.workoutsCount}
- Calories burned: ${userStats.caloriesBurned}
- Carbon footprint: ${userStats.totalCO2e?.toFixed ? userStats.totalCO2e.toFixed(2) : userStats.totalCO2e} kg CO₂
- Water usage: ${userStats.totalWater?.toFixed ? userStats.totalWater.toFixed(1) : userStats.totalWater} liters

Use this data to provide personalized advice and encouragement.`;
    }

    // Prepare messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...context,
      { role: 'user', content: userMessage }
    ];

    console.log('Sending request to DeepSeek API');
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return new Response('Sorry, I\'m having trouble thinking right now. Please try again in a moment.', {
        status: 500,
        headers: corsHeaders
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in kali-ai-chat:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders
    });
  }
});