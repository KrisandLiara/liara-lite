import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Helper function to get an authenticated Supabase client
async function getAuthenticatedSupabaseClient(req: Request): Promise<SupabaseClient> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
}

serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json(); // We only need session_id from the body now
    if (!session_id) {
      throw new Error('Missing required parameter: session_id');
    }

    const supabase = await getAuthenticatedSupabaseClient(req);
    
    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not found or authentication error');
    }

    // The RPC function will handle the authorization check, ensuring the user owns the session.
    // This is more secure as the user_id is derived from the JWT, not the request body.
    const { error: rpcError } = await supabase.rpc('delete_chat_session_and_related_data', {
      p_session_id: session_id,
      p_user_id: user.id // Use the authenticated user's ID
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      throw rpcError;
    }

    return new Response(JSON.stringify({ success: true, message: `Session ${session_id} deleted.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Main catch error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 