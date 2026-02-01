// Define types for memory entries and related functionality

export interface MemoryEntry {
  id: string;
  uuid: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  content: string;
  embedding?: number[];
  importance: number;
  tags: string[];
  metadata: any;
  summary?: string;
  topic?: string;
  sentiment?: string;
  type?: 'fact' | 'preference' | 'event' | 'quote' | 'idea';
  pinned: boolean;
  source_type: 'chat' | 'import' | 'manual';
  source_chat_id?: string;
  reference_links?: string[];
  conversation_title?: string;
  conversation_start_time?: string;
  role?: 'user' | 'assistant';
  // For frontend use
  similarity?: number;
  match_type?: ('hard' | 'semantic')[];
}

export interface CreateMemoryEntry {
  topic: string;
  summary: string;
  importance: number;
  tags: string[];
  content: string;
  role: "user" | "assistant" | "system";
  conversation_title: string | null;
  user_id?: string | null;
  sentiment?: string | null;
  type?: string | null;
  source_type?: string | null;
  pinned?: boolean;
  reference_links?: string | null;
  metadata?: Record<string, any> | null;
  reference_to?: string | null;
  timestamp?: string | null;
  related_to?: string | null;
  source?: string | null;
  model_version?: string | null;
}

export interface UpdateMemoryEntry {
  topic?: string;
  summary?: string;
  content?: string;
  importance?: number;
  tags?: string[];
  sentiment?: string | null;
  type?: string | null;
  source_type?: string | null;
  pinned?: boolean;
  reference_links?: string | null;
  metadata?: Record<string, any> | null;
  reference_to?: string | null;
  updated_at?: string;
  timestamp?: string | null;
  related_to?: string | null;
  source?: string | null;
  model_version?: string | null;
}

export interface MemorySearchResult {
  id: string;
  content: string;
  similarity: number;
}

export interface MemoryWithRelationships extends MemoryEntry {
  relationship_type?: string;
  relationship_strength?: number;
}

export interface MemorySearchOptions {
  maxMemories?: number;
  maxTokens?: number;
  includeSummary?: boolean;
  filterTags?: string[];
  similarityThreshold?: number;
}

export interface MemoryRelationshipOptions {
  relationshipType?: string;
  limit?: number;
  minStrength?: number;
}

export interface MemoryContext {
  memories: MemoryEntry[];
  summary: string;
  totalTokens: number;
  metadata: {
    search_query: string;
    timestamp: string;
    model_version: string;
    maxMemories: number;
    maxTokens: number;
    includeSummary: boolean;
  };
}

export interface TagWithCount {
  tag: string;
  occurrences: number;
}

export interface TopicWithCount {
  topic: string;
  occurrences: number;
}

export interface MemoryOverviewStats {
  total_memories: number;
  oldest_memory_date?: string;
  newest_memory_date?: string;
  avg_tags_per_memory?: number;
  total_unique_tags: number;
  total_topics: number;
}

export interface MemoryCluster {
  clusterTitle: string;
  memories: MemoryEntry[];
}

// New type for chat messages from chat_history table
export interface ChatMessage {
  id: string; // PK
  chat_session_id: string; // FK to chat_sessions.id
  user_id?: string | null; // FK to user_profiles.id (or Supabase auth.users.id)
  guest_session_id?: string | null; // FK to guest_sessions.id
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string; // timestamptz
  metadata?: Record<string, any> | null; // jsonb
}

// ChatSession interface
export interface ChatSession {
  id: string;
  user_id: string;
  guest_session_id?: string | null;
  title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
