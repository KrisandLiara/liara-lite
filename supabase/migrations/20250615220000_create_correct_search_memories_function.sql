create or replace function search_memories(
    p_user_id uuid,
    query_embedding vector(1536),
    similarity_threshold float default 0.78,
    match_count int default 10,
    filter_tags text[] default null
)
returns table (
    id uuid,
    created_at timestamp with time zone,
    user_id uuid,
    content text,
    importance real,
    reference_links text[],
    metadata jsonb,
    embedding vector(1536),
    source_chat_id uuid,
    similarity float
)
language sql stable
as $$
  select
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
  from memories
  where
    memories.user_id = p_user_id and
    1 - (memories.embedding <=> query_embedding) > similarity_threshold and
    (filter_tags is null or array_length(filter_tags, 1) is null or memories.tags @> filter_tags)
  order by similarity desc
  limit match_count;
$$; 