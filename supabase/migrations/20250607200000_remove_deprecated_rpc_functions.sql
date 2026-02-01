-- This migration removes old and unused RPC functions that are causing security warnings,
-- and fixes the search_path for the still-in-use update_updated_at_column function.

-- Fix the search path for the trigger function
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Drop all other deprecated functions
-- Note: We drop specific signatures for functions known to be ambiguous.
DROP FUNCTION IF EXISTS public.search_memories(uuid, text, text, integer);
DROP FUNCTION IF EXISTS public.search_memories(uuid, text, integer);

-- Drop other functions (will error if ambiguous, revealing which ones to fix next)
DROP FUNCTION IF EXISTS public.get_topic_cloud_data;
DROP FUNCTION IF EXISTS public.get_conversation_messages;
DROP FUNCTION IF EXISTS public.delete_chat_session_and_related_data;
DROP FUNCTION IF EXISTS public.get_distinct_tags;
DROP FUNCTION IF EXISTS public.match_memories;
DROP FUNCTION IF EXISTS public.get_chat_sessions_for_user;
DROP FUNCTION IF EXISTS public.get_embedding;
DROP FUNCTION IF EXISTS public.get_distinct_tags_with_counts;
DROP FUNCTION IF EXISTS public.get_messages_for_chat_session;
DROP FUNCTION IF EXISTS public.get_top_topics; 