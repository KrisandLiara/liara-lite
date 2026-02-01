drop policy "Users can insert their own chat history" on "public"."chat_history";

alter table "public"."memories" enable row level security;

alter table "public"."memory_relationships" enable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_recent_chat_sessions(p_user_id uuid, p_limit integer, p_offset integer)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, title text, last_message_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH user_sessions AS (
        SELECT DISTINCT ch.chat_session_id
        FROM chat_history ch
        WHERE ch.source = 'user' AND ch.metadata->>'user_id' = p_user_id::text
    )
    SELECT
        cs.id,
        cs.created_at,
        COALESCE(m.title, 'New Conversation') as title,
        MAX(ch.created_at) as last_message_at
    FROM
        chat_sessions cs
    JOIN
        user_sessions us ON cs.id = us.chat_session_id
    LEFT JOIN
        memories m ON cs.id = m.chat_session_id
    LEFT JOIN
        chat_history ch ON cs.id = ch.chat_session_id
    GROUP BY
        cs.id, m.title
    ORDER BY
        last_message_at DESC
    LIMIT
        p_limit
    OFFSET
        p_offset;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_memories(query_embedding vector, similarity_threshold double precision, match_count integer, p_user_id uuid, filter_tags text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, created_at timestamp with time zone, user_id uuid, content text, importance real, reference_links text[], metadata jsonb, embedding vector, source_chat_id uuid, similarity double precision)
 LANGUAGE sql
 STABLE
AS $function$
SELECT
    memories.id,
    memories.created_at,
    memories.user_id,
    memories.content,
    memories.importance,
    memories.reference_links,
    memories.metadata,
    memories.embedding,
    memories.source_chat_id,
    1 - (memories.embedding <=> query_embedding) as similarity
FROM
    memories
WHERE
    memories.user_id = p_user_id
    AND 1 - (memories.embedding <=> query_embedding) > similarity_threshold
    AND (filter_tags IS NULL OR memories.tags @> filter_tags)
ORDER BY
    similarity DESC
LIMIT
    match_count;
$function$
;

create policy "Users can only see their own chat history"
on "public"."chat_history"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete their own chat sessions"
on "public"."chat_sessions"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own chat sessions"
on "public"."chat_sessions"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can only see their own chat sessions"
on "public"."chat_sessions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update their own chat sessions"
on "public"."chat_sessions"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can only see their own memories"
on "public"."memories"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create relationships for memories they own"
on "public"."memory_relationships"
as permissive
for insert
to public
with check (((EXISTS ( SELECT 1
   FROM memories
  WHERE ((memories.id = memory_relationships.source_memory_id) AND (memories.user_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM memories
  WHERE ((memories.id = memory_relationships.target_memory_id) AND (memories.user_id = auth.uid()))))));


create policy "Users can view relationships of memories they own"
on "public"."memory_relationships"
as permissive
for select
to public
using (((EXISTS ( SELECT 1
   FROM memories
  WHERE ((memories.id = memory_relationships.source_memory_id) AND (memories.user_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM memories
  WHERE ((memories.id = memory_relationships.target_memory_id) AND (memories.user_id = auth.uid()))))));


create policy "Users can insert their own personality"
on "public"."personality"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can only access their own personality"
on "public"."personality"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update their own personality"
on "public"."personality"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own chat history"
on "public"."chat_history"
as permissive
for insert
to public
with check ((auth.uid() = user_id));



