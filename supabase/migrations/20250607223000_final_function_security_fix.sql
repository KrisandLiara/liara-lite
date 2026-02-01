-- This migration provides the definitive fix for all remaining "Function Search Path Mutable"
-- warnings by using the exact function signatures found in the master schema file.

ALTER FUNCTION public.get_recent_conversations(uuid, integer) SET search_path = public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;
ALTER FUNCTION public.get_memory_overview_stats() SET search_path = public;

-- Fix both signatures for the search_memories function
ALTER FUNCTION public.search_memories(query_embedding vector, similarity_threshold real, match_count integer, p_tags text[]) SET search_path = public;
ALTER FUNCTION public.search_memories(query_embedding vector, similarity_threshold double precision, match_count integer, filter_tags text[]) SET search_path = public;

-- Fix for the paginated conversations function found in the latest security scan
ALTER FUNCTION public.get_paginated_conversations_for_user(p_user_id UUID, p_limit INT, p_offset INT) SET search_path = public; 