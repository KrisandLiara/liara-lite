export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_type: string | null
          key_value: string
          last_used: string | null
          name: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_type?: string | null
          key_value: string
          last_used?: string | null
          name: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_type?: string | null
          key_value?: string
          last_used?: string | null
          name?: string
          notes?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          chat_session_id: string
          content: string
          created_at: string
          guest_session_id: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string | null
        }
        Insert: {
          chat_session_id: string
          content: string
          created_at?: string
          guest_session_id?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id?: string | null
        }
        Update: {
          chat_session_id?: string
          content?: string
          created_at?: string
          guest_session_id?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          guest_session_id: string | null
          id: string
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guest_session_id?: string | null
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guest_session_id?: string | null
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_guest_session_id_fkey"
            columns: ["guest_session_id"]
            isOneToOne: false
            referencedRelation: "guest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: number
          key: string | null
          name: string
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: number
          key?: string | null
          name: string
          scope?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: number
          key?: string | null
          name?: string
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      guest_sessions: {
        Row: {
          converted_to_user_id: string | null
          created_at: string
          id: string
          last_active: string
          session_token: string
        }
        Insert: {
          converted_to_user_id?: string | null
          created_at?: string
          id?: string
          last_active?: string
          session_token: string
        }
        Update: {
          converted_to_user_id?: string | null
          created_at?: string
          id?: string
          last_active?: string
          session_token?: string
        }
        Relationships: []
      }
      hard_memory_entries: {
        Row: {
          created_at: string | null
          fact: string
          id: string
          importance: number | null
          keywords: string[] | null
          pinned: boolean | null
          source_chat_id: string | null
          topic: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          fact: string
          id?: string
          importance?: number | null
          keywords?: string[] | null
          pinned?: boolean | null
          source_chat_id?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          fact?: string
          id?: string
          importance?: number | null
          keywords?: string[] | null
          pinned?: boolean | null
          source_chat_id?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hard_memory_entries_source_chat_id_fkey"
            columns: ["source_chat_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          content: string
          conversation_start_time: string | null
          conversation_title: string | null
          create_time: string | null
          created_at: string
          embedding: string | null
          id: string
          importance: number
          message_id: string | null
          metadata: Json | null
          model_version: string | null
          parent_id: string | null
          pinned: boolean | null
          reference_links: string[] | null
          reference_to: string | null
          related_to: string[] | null
          role: string | null
          sentiment: string | null
          source: string
          source_chat_id: string | null
          source_type: string | null
          summary: string | null
          tags: string[] | null
          timestamp: string
          topic: string | null
          type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_start_time?: string | null
          conversation_title?: string | null
          create_time?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          importance?: number
          message_id?: string | null
          metadata?: Json | null
          model_version?: string | null
          parent_id?: string | null
          pinned?: boolean | null
          reference_links?: string[] | null
          reference_to?: string | null
          related_to?: string[] | null
          role?: string | null
          sentiment?: string | null
          source: string
          source_chat_id?: string | null
          source_type?: string | null
          summary?: string | null
          tags?: string[] | null
          timestamp?: string
          topic?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_start_time?: string | null
          conversation_title?: string | null
          create_time?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          importance?: number
          message_id?: string | null
          metadata?: Json | null
          model_version?: string | null
          parent_id?: string | null
          pinned?: boolean | null
          reference_links?: string[] | null
          reference_to?: string | null
          related_to?: string[] | null
          role?: string | null
          sentiment?: string | null
          source?: string
          source_chat_id?: string | null
          source_type?: string | null
          summary?: string | null
          tags?: string[] | null
          timestamp?: string
          topic?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      memory_relationships: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          relationship_type: string
          source_memory_id: string | null
          strength: number | null
          target_memory_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          relationship_type: string
          source_memory_id?: string | null
          strength?: number | null
          target_memory_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          relationship_type?: string
          source_memory_id?: string | null
          strength?: number | null
          target_memory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_relationships_source_memory_id_fkey"
            columns: ["source_memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_relationships_target_memory_id_fkey"
            columns: ["target_memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      personality: {
        Row: {
          aspect_type: string
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          aspect_type: string
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          aspect_type?: string
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      token_usage: {
        Row: {
          guest_session_id: string | null
          id: string
          last_updated: string
          tokens_limit: number
          tokens_used: number
          user_id: string | null
        }
        Insert: {
          guest_session_id?: string | null
          id?: string
          last_updated?: string
          tokens_limit?: number
          tokens_used?: number
          user_id?: string | null
        }
        Update: {
          guest_session_id?: string | null
          id?: string
          last_updated?: string
          tokens_limit?: number
          tokens_used?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_usage_guest_session_id_fkey"
            columns: ["guest_session_id"]
            isOneToOne: false
            referencedRelation: "guest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_memory_overview_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_memories: number
          oldest_memory_date: string
          newest_memory_date: string
          total_tag_instances: number
          memories_with_tags_count: number
        }[]
      }
      get_paginated_conversations_for_user: {
        Args: { p_user_id: string; p_limit: number; p_offset: number }
        Returns: {
          id: string
          conversation_title: string
          conversation_start_time: string
          latest_message_time: string
          user_id: string
          total_valid_conversations: number
        }[]
      }
      get_recent_conversations: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          conversation_title: string
          latest_message_time: string
          conversation_start_time: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      search_memories: {
        Args:
          | {
              query_embedding: string
              similarity_threshold: number
              match_count: number
              filter_tags?: string[]
            }
          | {
              query_embedding: string
              similarity_threshold: number
              match_count: number
              p_tags?: string[]
            }
        Returns: {
          id: string
          created_at: string
          user_id: string
          content: string
          importance: number
          reference_links: string[]
          metadata: Json
          embedding: string
          source_chat_id: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      user_role: "admin" | "user" | "guest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "user", "guest"],
    },
  },
} as const
