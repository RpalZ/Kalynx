import { createClient } from 'npm:@supabase/supabase-js@2';

interface CreateProfileRequest {
  userId: string; // The user ID from Supabase Auth
  name: string;
  email: string; // Add email to the interface
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Create Supabase client with service_role key to bypass RLS for profile creation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service_role key here
    );

    const requestBody = await req.json();
    console.log('Received request body for profile creation:', requestBody);

    const { userId, name, email }: CreateProfileRequest = requestBody; // Destructure email

    if (!userId || !name || !email) { // Check for email presence
      return new Response('User ID, name, and email are required', {
        status: 400,
        headers: corsHeaders
      });
    }

    // Insert user profile into the 'users' table
    const { data: newProfile, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId, // Use userId as the id for the profile
        name: name,
        email: email, // Include email in the insert
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating profile in database:', dbError);
      return new Response('Failed to create user profile: ' + dbError.message, {
        status: 500,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify(newProfile), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in create-user-profile function:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders
    });
  }
}); 