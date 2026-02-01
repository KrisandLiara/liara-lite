# Supabase RPC Function: `search_memories`

## Description

This function searches for memories based on semantic similarity to a given query embedding. It requires a user ID to ensure data privacy and allows filtering by tags, limiting the number of results.

## Parameters

-   `p_user_id` (uuid): The ID of the user performing the search. This is a mandatory security parameter.
-   `query_embedding` (vector(1536)): The embedding vector of the search query.
-   `similarity_threshold` (float): The minimum similarity score (cosine similarity) for a memory to be considered a match. Values range from -1 to 1.
-   `match_count` (int): The maximum number of matching memories to return.
-   `filter_tags` (text[]): An optional array of tags. If provided, only memories containing *at least one* of the specified tags will be returned. Defaults to `null` (no tag filtering).

## Returns

A table of matching memories with the following columns:

-   `id` (uuid): The unique identifier of the memory.
-   `created_at` (timestamp with time zone): The timestamp when the memory was created.
-   `user_id` (uuid): The ID of the user who owns the memory.
-   `content` (text): The main textual content of the memory.
-   `importance` (real): A numerical value indicating the importance of the memory.
-   `reference_links` (text[]): An array of URLs or references associated with the memory.
-   `metadata` (jsonb): A JSON object containing additional metadata about the memory.
-   `embedding` (vector(1536)): The embedding vector of the memory content.
-   `source_chat_id` (uuid): The ID of the source chat, if applicable.
-   `similarity` (double precision): The cosine similarity score between the `query_embedding` and the memory's embedding.

## Usage Example (from Backend)

```javascript
// Example from within the backend API
const { data, error } = await supabase.rpc('search_memories', {
    p_user_id: userId,
    query_embedding: embeddingVector,
    match_threshold: 0.78,
    match_count: 10,
    filter_tags: ['project', 'supabase']
});
```

## Notes

-   The function calculates similarity as `1 - (memories.embedding <=> query_embedding)`, where `<=>` is the cosine distance operator. Therefore, a higher similarity score (closer to 1) indicates a better match.
-   Ensure the `pg_vector` extension is enabled in your Supabase instance.
-   The dimension of `query_embedding` (1536) must match the dimension of the `embedding` column in the `memories` table.
-   This function is secure and filters results based on the provided `p_user_id`, preventing data leakage between users.