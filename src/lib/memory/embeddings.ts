import { OpenAI } from 'openai';
import { supabase } from '@/lib/supabase';
import { config } from '@/config';

// Cache for the API key
let cachedApiKey: string | null = null;
let apiKeyLastChecked = 0;
const API_KEY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to get the OpenAI API key from the database
async function getOpenAIApiKey(): Promise<string | null> {
  const now = Date.now();
  if (cachedApiKey && now - apiKeyLastChecked < API_KEY_CACHE_DURATION) {
    return cachedApiKey;
  }

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.warn("Supabase not configured, cannot fetch OpenAI API key");
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke('get-api-key', {
      body: { type: 'openai' },
    });

    if (error) {
      console.warn("Could not invoke get-api-key function:", error.message);
      return null;
    }
    
    if (!data.available || !data.apiKey) {
      console.warn("No active OpenAI API key available from the function.");
      return null;
    }

    cachedApiKey = data.apiKey;
    apiKeyLastChecked = now;

    return data.apiKey;
  } catch (error) {
    console.warn("Failed to fetch API key via function:", error);
    return null;
  }
}

// Function to create OpenAI client with the API key
async function createOpenAIClient(): Promise<OpenAI | null> {
  try {
    const apiKey = await getOpenAIApiKey();
    if (!apiKey) {
      return null;
    }
    
    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Required for browser environment
    });
  } catch (error) {
    console.warn("Error creating OpenAI client:", error);
    return null;
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const openai = await createOpenAIClient();
    if (!openai) {
      console.warn('OpenAI API key not available. Returning mock embedding.');
      // Return a mock embedding of appropriate length
      return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    }
    
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    // Return a mock embedding in case of error
    return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  }
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const openai = await createOpenAIClient();
    if (!openai) {
      console.warn('OpenAI API key not available. Returning mock embeddings.');
      // Return mock embeddings
      return texts.map(() => Array(1536).fill(0).map(() => Math.random() * 2 - 1));
    }
    
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      encoding_format: "float",
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    // Return mock embeddings in case of error
    return texts.map(() => Array(1536).fill(0).map(() => Math.random() * 2 - 1));
  }
}

export async function getEmbeddingBatch(
  texts: string[],
  batchSize: number = 100
): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await getEmbeddings(batch);
    embeddings.push(...batchEmbeddings);
  }
  
  return embeddings;
}
