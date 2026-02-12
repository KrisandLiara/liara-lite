import { Database } from './database';

export type Memory = Database['public']['Tables']['memories']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];
export type Message = Database['public']['Tables']['chat_messages']['Row'];

export interface Database {
  public: {
    Tables: {
      memory_entries: {
        Row: {
          id: string;
          topic: string;
          summary: string;
          full_text: string | null;
          created_at: string;
          last_referenced: string;
          importance: number;
          tags: string[];
          source_chat_id: string | null;
          user_id: string | null;
          guest_session_id: string | null;
          embedding: string | null;
          sentiment: string | null;
          type: string | null;
          source_type: string | null;
          pinned: boolean;
          reference_links: string[] | null;
          metadata: Record<string, any> | null;
          reference_to: string | null;
        };
        Insert: {
          id?: string;
          topic: string;
          summary: string;
          full_text?: string | null;
          created_at?: string;
          last_referenced?: string;
          importance: number;
          tags: string[];
          source_chat_id?: string | null;
          user_id?: string | null;
          guest_session_id?: string | null;
          embedding?: string | null;
          sentiment?: string | null;
          type?: string | null;
          source_type?: string | null;
          pinned?: boolean;
          reference_links?: string[] | null;
          metadata?: Record<string, any> | null;
          reference_to?: string | null;
        };
        Update: {
          id?: string;
          topic?: string;
          summary?: string;
          full_text?: string | null;
          created_at?: string;
          last_referenced?: string;
          importance?: number;
          tags?: string[];
          source_chat_id?: string | null;
          user_id?: string | null;
          guest_session_id?: string | null;
          embedding?: string | null;
          sentiment?: string | null;
          type?: string | null;
          source_type?: string | null;
          pinned?: boolean;
          reference_links?: string[] | null;
          metadata?: Record<string, any> | null;
          reference_to?: string | null;
        };
      };
      memory_relationships: {
        Row: {
          id: string;
          source_memory_id: string;
          target_memory_id: string;
          relationship_type: string;
          strength: number;
          created_at: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          source_memory_id: string;
          target_memory_id: string;
          relationship_type: string;
          strength?: number;
          created_at?: string;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          source_memory_id?: string;
          target_memory_id?: string;
          relationship_type?: string;
          strength?: number;
          created_at?: string;
          metadata?: Record<string, any> | null;
        };
      };
    };
    Functions: {
      search_memories: {
        Args: {
          query_embedding: string;
          similarity_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          content: string;
          similarity: number;
        }[];
      };
    };
  };
} 