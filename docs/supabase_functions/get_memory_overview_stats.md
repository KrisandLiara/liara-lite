# Supabase RPC Function: `get_memory_overview_stats`

## Description

Provides a statistical overview of a user's memories, including total counts, recent additions, average importance, and counts of distinct tags and topics.

## Parameters

-   `p_user_id` (uuid): The ID of the user whose memory statistics are to be retrieved.

## Returns

A single row with the following columns:

-   `total_memories` (bigint): The total number of memories for the user.
-   `memories_today` (bigint): The number of memories created on the current day.
-   `memories_this_week` (bigint): The number of memories created since the start of the current week (Monday).
-   `memories_this_month` (bigint): The number of memories created since the start of the current month.
-   `average_importance` (real): The average `importance` score across all the user's memories.
-   `distinct_tags_count` (bigint): The total number of unique tags associated with the user's memories.
-   `distinct_topics_count` (bigint): The total number of unique topics (from `metadata->>'topic'`) associated with the user's memories.

## Usage Example (SQL)

```sql
SELECT * FROM get_memory_overview_stats('your-user-id-uuid');
```

## Notes

-   The function uses `date_trunc` to determine the start of the week and month.
-   `distinct_tags_count` unnests tags and counts distinct non-empty tags.
-   `distinct_topics_count` counts distinct non-null topics from the `metadata` field. 