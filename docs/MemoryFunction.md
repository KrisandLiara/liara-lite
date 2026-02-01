# Memory Function

## Overview
Liara Chat implements a memory system that allows the AI to retain context across conversations. This enables more personalized and coherent interactions by referencing past information and user preferences.

## Memory Types

### Short-term Memory
- Maintained within a chat session
- Provides immediate context for the current conversation
- Implemented via chat history tracking in the current session

### Long-term Memory
- Persisted across multiple sessions
- Stored in the memory_entries table
- Enables the AI to recall important information about users over time

## Memory Processing

### Embedding Generation
- Text inputs are converted to vector embeddings using OpenAI's embedding models
- These embeddings enable semantic similarity search
- Stored in the database using the PostgreSQL vector extension

### Memory Retrieval
- Before responding to user queries, relevant memories are retrieved
- The system searches for semantically similar content using vector similarity
- The `search_memories` function returns memories above a similarity threshold
- Retrieved memories are injected into the context provided to the AI

### Memory Storage
- Important information is extracted from conversations
- Information is categorized, summarized, and stored with metadata
- The system assigns importance scores to prioritize critical information

## Memory Management

### Pinning
- Critical memories can be manually pinned for guaranteed retrieval
- Pinned memories bypass the relevance threshold checks

### Tagging
- Memories are automatically tagged with relevant keywords
- Tags allow for categorical filtering during retrieval

### Memory Decay
- Less important or older memories may become less accessible over time
- This mimics human memory decay patterns
- The relevance threshold for retrieving older memories increases with time

## Database Implementation

### Vectors and Similarity Search
- The application uses the `vector` extension in PostgreSQL
- The `search_memories` function performs cosine similarity searches
- Example SQL function:
```sql
CREATE OR REPLACE FUNCTION public.search_memories(
  query_embedding vector, 
  similarity_threshold double precision, 
  match_count integer
)
RETURNS TABLE(id uuid, content text, similarity double precision)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    memory_entries.id,
    memory_entries.full_text as content,
    1 - (memory_entries.embedding <=> query_embedding) as similarity
  FROM memory_entries
  WHERE 1 - (memory_entries.embedding <=> query_embedding) > similarity_threshold
  ORDER BY memory_entries.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
```

### memory_entries Table Structure

| Column           | Type           | Description                                               |
|------------------|----------------|-----------------------------------------------------------|
| id               | uuid           | Primary key                                               |
| topic            | text           | Topic or title of the memory                              |
| summary          | text           | Short summary of the memory                               |
| full_text        | text           | Main content of the memory                                |
| created_at       | timestamptz    | Creation timestamp                                        |
| last_referenced  | timestamptz    | Last time this memory was referenced                      |
| importance       | integer        | Importance score                                          |
| tags             | text[]         | Array of tags                                             |
| source_chat_id   | uuid           | (Optional) Source chat ID                                 |
| user_id          | uuid           | (Optional) User ID                                        |
| guest_session_id | uuid           | (Optional) Guest session ID                               |
| embedding        | vector(1536)   | Vector embedding for semantic search                      |
| sentiment        | text           | (Optional) Sentiment label                                |
| type             | text           | Memory type: 'semantic', 'hard', or 'hybrid'             |
| source_type      | text           | (Optional) Source type                                    |
| pinned           | boolean        | Whether the memory is pinned                              |
| reference_links  | text[]         | (Optional) Reference links                                |
| metadata         | jsonb          | (Optional) Additional metadata                            |
| reference_to     | uuid           | (Optional) References another memory (for linking)        |

## Memory Flow Example

- **When importing or creating a memory:**
  - Set `type` to `'hard'` for exact logs, `'semantic'` for summaries, or `'hybrid'` if both.
  - Use `reference_to` to link summaries or condensed memories to their originals.
  - Generate and store an embedding for semantic search.

- **Retrieval:**
  - Use vector search on `embedding` for context-rich queries.
  - Use `full_text` for quoting or grounding output.
  - Use `reference_to` to trace relationships between memories.
