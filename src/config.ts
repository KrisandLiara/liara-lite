
export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  backendApiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY,
  modelVersion: 'gpt-4o-mini'
};
