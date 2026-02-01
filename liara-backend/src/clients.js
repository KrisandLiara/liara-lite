import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
export const openai = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;