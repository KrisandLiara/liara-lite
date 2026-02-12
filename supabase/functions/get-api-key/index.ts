import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log("get-api-key function invoked");
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating Supabase client");
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Parse request body
    console.log("Parsing request body");
    const { type, isGuest } = await req.json();
    console.log(`Request type: ${type}, isGuest: ${isGuest || false}`);

    if (type !== 'openai') {
      console.error(`Invalid API key type requested: ${type}`);
      return new Response(JSON.stringify({ error: 'Invalid API key type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get the most recently created active API key
    console.log("Fetching active API key from database");
    const { data, error } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching API key:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch API key', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data || data.length === 0) {
      console.warn("No active API keys found in database");
      return new Response(JSON.stringify({ available: false, message: 'No active API keys found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`API Key found (ID: ${data[0].id}), updating last_used timestamp`);
    if (isGuest) {
      console.log("Guest user is requesting API key");
    }

    // Update the last_used timestamp for the API key
    try {
      const updateResult = await supabaseClient
        .from('api_keys')
        .update({ last_used: new Date().toISOString() })
        .eq('id', data[0].id);

      if (updateResult.error) {
        console.error("Failed to update last_used timestamp:", updateResult.error);
      } else {
        console.log("Last_used timestamp updated successfully");
      }
    } catch (updateError) {
      console.error("Exception when updating last_used timestamp:", updateError);
    }

    console.log("Returning API key to client (key ID:", data[0].id, ")");
    return new Response(
      JSON.stringify({
        apiKey: data[0].key_value,
        available: true,
        keyId: data[0].id,
        keyName: data[0].name,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (e) {
    const error = e as Error;
    console.error('Error in get-api-key function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 