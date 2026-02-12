CREATE OR REPLACE FUNCTION search_memories(
    query_embedding vector(1536),
    similarity_threshold float,
    match_count int,
    p_user_id uuid,
    filter_tags text[] default null
)
RETURNS TABLE (
    id uuid,
    created_at timestamp with time zone,
    user_id uuid,
    content text,
    importance real,
    reference_links text[],
    metadata jsonb,
    embedding vector(1536),
    source_chat_id uuid,
    similarity double precision
)
LANGUAGE sql STABLE
AS $$
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
$$; 