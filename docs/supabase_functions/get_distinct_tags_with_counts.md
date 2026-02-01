# Supabase RPC Function: `get_distinct_tags_with_counts`

## Description

Retrieves a list of distinct tags for a user, along with the count of memories associated with each tag. The results are ordered by count (descending) and then by tag name (ascending), and limited by a specified number.

## Parameters

-   `p_user_id` (uuid): The ID of the user whose tags are to be retrieved.
-   `p_tag_limit` (integer, optional): The maximum number of tags to return. Defaults to 10.

## Returns

A table with the following columns:

-   `tag` (text): A distinct tag string.
-   `count` (bigint): The number of memories associated with this tag for the given user.

## Usage Example (SQL)

```sql
-- Get top 5 tags for a user
SELECT * FROM get_distinct_tags_with_counts('your-user-id-uuid', 5);

-- Get top 10 tags (default limit)
SELECT * FROM get_distinct_tags_with_counts('your-user-id-uuid');
```

## Notes

-   The function unnests tags from the `tags` array column in the `memories` table.
-   It filters out memories with `NULL` or empty `tags` arrays.
-   Useful for displaying tag clouds or popular tags. 