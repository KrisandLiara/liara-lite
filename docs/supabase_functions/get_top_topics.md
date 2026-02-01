# Supabase RPC Function: `get_top_topics`

## Description

Retrieves a list of top topics for a user, based on the `topic` field within the `metadata` JSONB column of their memories. It counts occurrences of each topic and returns the most frequent ones.

## Parameters

-   `p_user_id` (uuid): The ID of the user whose topics are to be retrieved.
-   `p_topic_limit` (integer, optional): The maximum number of topics to return. Defaults to 10.

## Returns

A table with the following columns:

-   `topic` (text): A topic string extracted from `metadata->>'topic'`. If a memory has no topic specified, it is grouped under "Untopiced".
-   `count` (bigint): The number of memories associated with this topic for the given user.

## Usage Example (SQL)

```sql
-- Get top 5 topics for a user
SELECT * FROM get_top_topics('your-user-id-uuid', 5);

-- Get top 10 topics (default limit)
SELECT * FROM get_top_topics('your-user-id-uuid');
```

## Notes

-   The function accesses the `topic` key within the `metadata` JSONB field (e.g., `metadata: {"topic": "Project X"}`).
-   Memories without a `topic` field in their metadata are categorized as "Untopiced".
-   Results are ordered by count (descending) and then by topic name (ascending).
-   Useful for displaying topic clouds or popular topics. 