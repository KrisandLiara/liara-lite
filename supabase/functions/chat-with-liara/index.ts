import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const _supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create Supabase client with service role for internal operations
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default values for LLM parameters, to be overridden by personality settings if available
const DEFAULT_LLM_MODEL = 'gpt-4o-mini';
const DEFAULT_TEMPERATURE = 0.7;
const _DEFAULT_MAX_TOKENS = 1000;
const DEFAULT_SYSTEM_MESSAGE = 'You are Liara, a helpful and friendly AI assistant. Be concise, helpful, and friendly in your responses.';
const GUEST_SYSTEM_MESSAGE = 'You are a helpful AI assistant. Please keep your answers concise. As a guest, your conversation is not saved long-term.'; // New guest prompt

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, userId, guestSessionId, isGuestUser, conversationId } = await req.json();

    // Get the server API key from the database
    const { data: apiKeyData, error: apiKeyError } = await adminClient
      .from('api_keys')
      .select('key_value, name')
      .in('name', ['Server API Key', 'Guest/Personal'])
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (apiKeyError || !apiKeyData) {
      console.error("Error fetching server API key:", apiKeyError || "No active server API key found");
      throw new Error("No active server API key found. Please add one in the Admin panel.");
    }

    const openAIApiKey = apiKeyData.key_value;
    console.log(`Using API key named: ${apiKeyData.name}`);

    // Update last_used timestamp for the API key
    await adminClient
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('key_value', openAIApiKey);

    // Fetch personality settings for the default chat system prompt
    let systemMessageContent = DEFAULT_SYSTEM_MESSAGE;
    let llmModel = DEFAULT_LLM_MODEL;
    let llmTemperature = DEFAULT_TEMPERATURE;
    let historyForPrompt: { role: string; content: string }[] = [];

    if (isGuestUser) {
      console.log('[chat-with-liara] Handling request as GUEST user.');
      // Try to fetch a specific Guest System Prompt personality
      try {
        console.log('[chat-with-liara] Fetching GuestPrompt personality...');
        const { data: guestPersonalityData, error: guestPersonalityError } = await adminClient
          .from('personality')
          .select('content, metadata')
          .eq('aspect_type', 'system_prompt_chat')
          .eq('name', 'GuestPrompt')
          .is('user_id', null) // Global prompt
          .eq('is_active', true)
          .maybeSingle();

        if (guestPersonalityError) {
          console.warn('[chat-with-liara] Error fetching GuestPrompt personality:', guestPersonalityError.message, 'Using hardcoded guest prompt.');
          systemMessageContent = GUEST_SYSTEM_MESSAGE; // Fallback to hardcoded
        } else if (guestPersonalityData) {
          console.log('[chat-with-liara] Successfully fetched GuestPrompt personality settings.');
          systemMessageContent = guestPersonalityData.content || GUEST_SYSTEM_MESSAGE;
          if (guestPersonalityData.metadata) {
            llmModel = guestPersonalityData.metadata.model || llmModel;
            llmTemperature = typeof guestPersonalityData.metadata.temperature === 'number' ? guestPersonalityData.metadata.temperature : llmTemperature;
          }
        } else {
          console.log('[chat-with-liara] No specific GuestPrompt personality found. Using hardcoded guest prompt.');
          systemMessageContent = GUEST_SYSTEM_MESSAGE; // Fallback to hardcoded
        }
      } catch (e: any) {
        console.warn('[chat-with-liara] Exception while fetching GuestPrompt personality:', e.message, 'Using hardcoded guest prompt.');
        systemMessageContent = GUEST_SYSTEM_MESSAGE; // Fallback to hardcoded
      }
      console.log(`[chat-with-liara] Using GUEST system prompt. Model: ${llmModel}, Temp: ${llmTemperature}`);
    } else if (userId) {
      console.log(`[chat-with-liara] Handling request for AUTHENTICATED user: ${userId}`);
      // Fetch personality settings for the default chat system prompt for the authenticated user
      try {
        console.log(`[chat-with-liara] Fetching personality for user: ${userId}`);
        const { data: personalityData, error: personalityError } = await adminClient
          .from('personality')
          .select('content, metadata')
          .eq('aspect_type', 'system_prompt_chat')
          .eq('name', 'Default Chat System Prompt')
          .eq('user_id', userId)
          .maybeSingle();

        if (personalityError) {
          console.warn('[chat-with-liara] Error fetching personality:', personalityError.message, 'Using default prompt settings.');
        } else if (personalityData) {
          console.log('[chat-with-liara] Successfully fetched user-specific personality settings.');
          systemMessageContent = personalityData.content || systemMessageContent;
          if (personalityData.metadata) {
            llmModel = personalityData.metadata.model || llmModel;
            llmTemperature = typeof personalityData.metadata.temperature === 'number' ? personalityData.metadata.temperature : llmTemperature;
          }
           console.log(`[chat-with-liara] Using user-specific settings: Model: ${llmModel}, Temp: ${llmTemperature}`);
        } else {
          console.log('[chat-with-liara] No user-specific personality found. Using hardcoded default prompt.');
          // systemMessageContent remains DEFAULT_SYSTEM_MESSAGE
        }
      } catch (e: any) {
        console.warn('[chat-with-liara] Exception while fetching personality:', e.message, 'Using default prompt settings.');
      }
      
      // Fetch chat history if a conversationId was provided
      if (conversationId) {
          const HISTORY_LIMIT = 10;
          console.log(`[chat-with-liara] Fetching last ${HISTORY_LIMIT} messages for conversationId: ${conversationId}`);
          const { data: historyData, error: historyError } = await adminClient
            .from('chat_history')
            .select('role, content')
            .eq('chat_session_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(HISTORY_LIMIT);

          if (historyError) {
            console.error('[chat-with-liara] Error fetching chat history:', historyError.message);
            // Not throwing an error, proceed without history if it fails
          } else if (historyData && historyData.length > 0) {
            console.log(`[chat-with-liara] Fetched ${historyData.length} messages from history.`);
            // Reverse to make it chronological (oldest to newest) for the prompt
            historyForPrompt = historyData.reverse().map((msg: { role: string; content: string }) => ({
              role: msg.role,
              content: msg.content
            }));
          }
      }
    } else {
      console.log('[chat-with-liara] Handling request as AUTHENTICATED user (no conversationId or no userId for history).');
      // Fetch personality settings for the default chat system prompt for authenticated users
      try {
        console.log('[chat-with-liara] Fetching default chat system prompt personality for authenticated user (no history context)...');
        const { data: personalityData, error: personalityError } = await adminClient
          .from('personality')
          .select('content, metadata')
          .eq('aspect_type', 'system_prompt_chat')
          .eq('name', 'Default Chat System Prompt')
          .is('user_id', null) // Global prompt
          .maybeSingle();

        if (personalityError) {
          console.warn('[chat-with-liara] Error fetching personality:', personalityError.message, 'Using default prompt settings.');
        } else if (personalityData) {
          console.log('[chat-with-liara] Successfully fetched personality settings.');
          systemMessageContent = personalityData.content || systemMessageContent;
          if (personalityData.metadata) {
            llmModel = personalityData.metadata.model || llmModel;
            llmTemperature = typeof personalityData.metadata.temperature === 'number' ? personalityData.metadata.temperature : llmTemperature;
            console.log(`[chat-with-liara] Using settings: Model: ${llmModel}, Temp: ${llmTemperature}`);
          }
        } else {
          console.log('[chat-with-liara] No specific personality found. Using default settings.');
        }
      } catch (e: any) {
        console.warn('[chat-with-liara] Exception while fetching personality:', e.message, 'Using default prompt settings.');
      }
    }

    // Construct the messages array for OpenAI
    const messages = [
      { 
        role: 'system',
        content: systemMessageContent 
      },
      ...historyForPrompt,
      { role: 'user', content: userMessage }
    ];

    console.log('[chat-with-liara] Messages being sent to OpenAI:', JSON.stringify(messages, null, 2));

    // Call OpenAI API
    // Define a fixed max_tokens for the output; 4096 is max for GPT-4 Turbo output
    const fixedOutputMaxTokens = 4096;
    console.log(`[chat-with-liara] Calling OpenAI with model: ${llmModel}, temp: ${llmTemperature}, max_tokens (output): ${fixedOutputMaxTokens}`);
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmModel,
        messages: messages,
        temperature: llmTemperature,
        max_tokens: fixedOutputMaxTokens, // Use the fixed value here
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({ error: { message: "Failed to parse OpenAI error response." } }));
      console.error('[chat-with-liara] OpenAI API error. Status:', openaiResponse.status, 'Body:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const responseData = await openaiResponse.json();
    const aiResponse = responseData.choices[0].message.content;

    return new Response(JSON.stringify({ 
      aiResponse,
      userId,
      guestSessionId,
      isGuestUser
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[chat-with-liara] Error in chat-with-liara function:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
