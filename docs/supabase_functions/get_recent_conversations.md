# Supabase RPC Function: `get_recent_conversations`

## Description

Retrieves a list of a user's recent conversations, ordered by the timestamp of the latest message/memory entry in each conversation. This is useful for displaying a "Recent Conversations" list in a UI.

## Parameters

-   `p_user_id` (uuid): The ID of the user whose recent conversations are to be retrieved.
-   `p_limit` (integer, optional): The maximum number of recent conversations to return. Defaults to 10.

## Returns

A table with the following columns for each recent conversation:

-   `conversation_title` (text): The title of the conversation.
-   `latest_message_time` (timestamp with time zone): The timestamp of the most recent memory entry associated with this conversation title.
-   `conversation_start_time` (timestamp with time zone): The `conversation_start_time` associated with the memory entry that has the `latest_message_time` for that conversation title.

## Assumptions

-   The `memories` table contains entries that can be grouped by `conversation_title`.
-   Each relevant entry in the `memories` table has:
    -   `user_id` (uuid)
    -   `conversation_title` (text)
    -   `create_time` (timestamptz), representing the timestamp of that memory entry/message.
    -   `conversation_start_time` (timestamptz), representing the original start of the conversation thread.
-   **Crucially, for any conversation to be listed for a given `p_user_id`, there must be records in the `memories` table where the `user_id` column matches `p_user_id` AND the `conversation_title` column is NOT NULL. If `user_id` is NULL or does not match, or if `conversation_title` is NULL for a user's memories, those memories will not contribute to any conversation returned by this function.**

## Logic

1.  **`conversation_activity` CTE**: Groups memory entries by `conversation_title` for the given `p_user_id` and finds the maximum `create_time` (aliased as `max_message_time`) for each conversation. This determines the timestamp of the latest activity.
2.  **`conversation_details` CTE**: For each conversation title, it attempts to find a representative `conversation_start_time`. It does this by joining back to the `memories` table on `conversation_title` and where the memory's `create_time` matches the `max_message_time` found in the previous CTE. `DISTINCT ON (ca.conversation_title)` is used to pick one `conversation_start_time` if multiple memory entries share the latest timestamp for a conversation (ordering by `m.created_at DESC` as a tie-breaker, though `m.id` might be more deterministic if `created_at` could be identical for different original messages mapped to memories).
3.  **Final SELECT**: Joins `conversation_activity` with `conversation_details` (left join to ensure all conversations from activity CTE are listed) and orders the results by `latest_message_time` descending, applying the `p_limit`.

## Usage Example (SQL)

```sql
-- Get the top 5 most recent conversations for a user
SELECT * FROM get_recent_conversations('your-user-id-uuid', 5);

-- Get the top 10 most recent conversations (default limit)
SELECT * FROM get_recent_conversations('your-user-id-uuid');
```