import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from './../_shared/cors.ts';

// Constants for the Q&A agent
const SIMILARITY_THRESHOLD_FOR_QA = 0.05; // Restored to default
const MATCH_COUNT_FOR_QA_CONTEXT = 5    // Tunable: How many memory snippets to feed to the LLM
const OPENAI_EMBEDDING_MODEL = 'text-embedding-ada-002'
const OPENAI_CHAT_MODEL = 'gpt-3.5-turbo' // Or 'gpt-4' if you have access and prefer it
const DEFAULT_API_KEY_NAMES = ['OpenAI', 'Guest/Personal', 'Default'] // Names to try for the API key

interface RequestBody {
  question: string;
  userId: string;
}

interface MemorySnippet {
  id: string;
  content: string;
  topic?: string;
  created_at?: string;
  // Add other relevant fields from your 'search_memories' RPC if needed
}

interface SearchMemoriesResponse {
  memories: MemorySnippet[];
  totalCount: number;
}

console.log('Memory Q&A Agent function booting up...')

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question, userId }: RequestBody = await req.json()
    if (!question || !userId) {
      return new Response(JSON.stringify({ error: 'Missing question or userId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log(`Received question: "${question}" for userId: ${userId}`)

    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch personality settings
    let systemPromptContent = "You are an AI assistant helping a user recall information from their personal digital memories. Your task is to answer the user\'s question based *only* on the provided memory snippets. If the information is not present, say so clearly. Do not use external knowledge. Be concise.";
    let llmModel = OPENAI_CHAT_MODEL; // Default model
    let llmMaxTokens = 200; // Default max tokens
    let llmTemperature = 0.3; // Default temperature

    try {
      console.log('Fetching default chat system prompt personality...');
      const { data: personalityData, error: personalityError } = await supabaseAdminClient
        .from('personality')
        .select('content, metadata')
        .eq('aspect_type', 'system_prompt_chat')
        .eq('name', 'Default Chat System Prompt')
        .is('user_id', null)
        .maybeSingle(); // Use maybeSingle to handle null case gracefully

      if (personalityError) {
        console.warn('Error fetching personality:', personalityError.message, 'Using default prompt settings.');
      } else if (personalityData) {
        console.log('Successfully fetched personality settings.', personalityData);
        systemPromptContent = personalityData.content || systemPromptContent;
        if (personalityData.metadata) {
          llmModel = personalityData.metadata.model || llmModel;
          llmMaxTokens = personalityData.metadata.tokenLimit || llmMaxTokens;
          llmTemperature = typeof personalityData.metadata.temperature === 'number' ? personalityData.metadata.temperature : llmTemperature;
          console.log(`Using model: ${llmModel}, maxTokens: ${llmMaxTokens}, temperature: ${llmTemperature}`);
        }
      } else {
        console.log('No specific personality found for default chat system prompt. Using default settings.');
      }
    } catch (e: any) {
      console.warn('Exception while fetching personality:', e.message, 'Using default prompt settings.');
    }

    let openAIApiKey: string | null = null;

    // Try to get local dev API key first if running locally (e.g., via supabase functions serve)
    const localDevApiKey = Deno.env.get('OPENAI_API_KEY_LOCAL_DEV');
    // A simple check to see if we might be in a local dev environment (e.g. if SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED is not set, which is often true for local)
    // This is just a heuristic; adjust as needed for your local setup detection.
    const isLocalDevEnvironment = !Deno.env.get('SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED'); 

    if (isLocalDevEnvironment && localDevApiKey) {
      console.log('Using local development OpenAI API key from environment variables.');
      openAIApiKey = localDevApiKey;
    } else {
      // Production: Fetch OpenAI API Key by invoking the get-api-key function
      console.log('Attempting to fetch OpenAI API key via get-api-key function...');
      const { data: keyData, error: keyError } = await supabaseAdminClient.functions.invoke(
        'get-api-key',
        { body: { 
            userId: userId, 
            keyNames: DEFAULT_API_KEY_NAMES, 
            type: "openai"
          } 
        }
      )

      if (keyError) {
        console.error('Error invoking get-api-key function:', keyError.message);
        return new Response(JSON.stringify({ error: 'Failed to invoke get-api-key function.', details: keyError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      
      if (!keyData || !keyData.apiKey) {
        console.error('Could not retrieve OpenAI API key from get-api-key response:', keyData);
        return new Response(JSON.stringify({ error: 'Could not retrieve valid OpenAI API key for the user.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }
      openAIApiKey = keyData.apiKey;
      console.log('Successfully fetched OpenAI API key via get-api-key function.');
    }

    if (!openAIApiKey) {
      // This case should ideally not be reached if the logic above is sound, but as a fallback:
      console.error('OpenAI API Key is null after attempting all fetch methods.');
      return new Response(JSON.stringify({ error: 'Failed to obtain OpenAI API key.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 3. Get Question Embedding
    console.log(`Generating embedding for question: "${question}"`)
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        input: question,
        model: OPENAI_EMBEDDING_MODEL,
      }),
    })

    if (!embeddingResponse.ok) {
      const errorBody = await embeddingResponse.json().catch(() => ({ error: { message: "Failed to parse embedding error response." } }));
      console.error('OpenAI Embedding API error. Status:', embeddingResponse.status, 'Body:', errorBody);
      return new Response(JSON.stringify({ error: 'Failed to generate question embedding.', details: errorBody.error?.message || 'Unknown embedding API error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
    const embeddingData = await embeddingResponse.json()
    const questionEmbedding: number[] = embeddingData.data[0].embedding
    console.log('Successfully generated question embedding.')

    // 4. Perform Semantic Search for Relevant Memories
    console.log(`Searching memories with threshold: ${SIMILARITY_THRESHOLD_FOR_QA}, count: ${MATCH_COUNT_FOR_QA_CONTEXT}`)
    const { data: searchData, error: searchError } = await supabaseAdminClient.rpc('search_memories', {
      query_embedding: JSON.stringify(questionEmbedding), // Ensure it's stringified if your RPC expects that
      similarity_threshold: SIMILARITY_THRESHOLD_FOR_QA,
      match_count: MATCH_COUNT_FOR_QA_CONTEXT,
      p_tags: null, // Not using tag filters for this Q&A agent for now
    })

    if (searchError) {
      console.error('Error searching memories via RPC:', searchError)
      return new Response(JSON.stringify({ error: 'Failed to search memories.', details: searchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const memories = (searchData as SearchMemoriesResponse | null)?.memories || []; // Corrected const_memories to memories
    console.log(`Found ${memories.length} relevant memory snippets.`)

    if (memories.length === 0) {
      return new Response(JSON.stringify({ answer: "I couldn't find any specific memories related to your question." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 5. Prepare Context and Prompt for LLM
    let contextForLLM = "Based ONLY on the following memory snippets, please answer the user\'s question.\nIf the information is not present in these snippets, clearly state that you cannot find an answer in the provided memories. Do not make up information or use external knowledge. Be concise.\n\n";
    contextForLLM += `User\'s Question: "${question}"\n\nProvided Memory Snippets:\n---\n`;
    memories.forEach((mem: MemorySnippet, index: number) => {
      contextForLLM += `Memory ${index + 1} (Topic: ${mem.topic || 'N/A'}, Date: ${mem.created_at ? new Date(mem.created_at).toLocaleDateString() : 'N/A'}):\n${mem.content}\n---\n`;
    });

    console.log('Context being sent to LLM:', contextForLLM);

    // 6. Synthesize Answer with LLM
    console.log('Sending request to OpenAI Chat Completions API...')
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: llmModel, // Use fetched or default model
        messages: [
          {
            role: 'system',
            content: systemPromptContent // Use fetched or default system prompt
          },
          {
            role: 'user',
            content: contextForLLM // This includes the question and the snippets
          }
        ],
        temperature: llmTemperature, // Use fetched or default temperature
        max_tokens: llmMaxTokens,  // Use fetched or default max tokens
      }),
    })

    if (!chatResponse.ok) {
      const errorBody = await chatResponse.json().catch(() => ({ error: { message: "Failed to parse chat error response." } }));
      console.error('OpenAI Chat API error. Status:', chatResponse.status, 'Body:', errorBody);
      return new Response(JSON.stringify({ error: 'Failed to get answer from AI model.', details: errorBody.error?.message || 'Unknown chat API error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const chatData = await chatResponse.json()
    const llmAnswer = chatData.choices[0]?.message?.content?.trim() || "Sorry, I couldn't formulate an answer.";
    console.log('Successfully received answer from LLM:', llmAnswer)

    // 7. Return the Answer
    return new Response(JSON.stringify({ answer: llmAnswer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Critical error in answer_memory_question function:', error)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 