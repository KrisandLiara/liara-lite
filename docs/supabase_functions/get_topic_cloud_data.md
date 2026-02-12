# Supabase RPC Function: `get_topic_cloud_data`

## Description

Retrieves data suitable for generating a topic cloud. It counts the occurrences of each topic (from `metadata->>'topic'`) for a given user and returns the most frequent topics.

## Parameters

-   `p_user_id` (uuid): The ID of the user whose topic data is to be retrieved.
-   `p_topic_limit` (integer, optional): The maximum number of topics to return for the cloud. Defaults to 20.

## Returns

A table with the following columns:

-   `topic` (text): The name of the topic. If a memory has no topic specified in its `metadata`, it is grouped under "Untopiced".
-   `count` (bigint): The number of memories associated with this topic for the given user.

## Usage Example (SQL)

```sql
-- Get data for a topic cloud with up to 15 topics
SELECT * FROM get_topic_cloud_data('your-user-id-uuid', 15);

-- Get data for a topic cloud with default limit (20 topics)
SELECT * FROM get_topic_cloud_data('your-user-id-uuid');
```

## Notes

-   This function is similar to `get_top_topics` but is specifically named for topic cloud generation, potentially with a different default limit or minor variations in the future.
-   Topics are extracted from the `topic` key within the `metadata` JSONB field.
-   Memories without a `topic` in their metadata are categorized as "Untopiced".
-   Results are ordered by count (descending) and then by topic name (ascending). 