# Supabase RPC Function: `get_distinct_tags`

## Description

Retrieves a distinct, alphabetized list of all tags associated with a user's memories.

## Parameters

-   `p_user_id` (uuid): The ID of the user whose tags are to be retrieved.

## Returns

A table with a single column:

-   `tag` (text): A distinct tag string.

## Usage Example (SQL)

```sql
SELECT * FROM get_distinct_tags('your-user-id-uuid');
```

## Notes

-   The function unnests tags from the `tags` array column in the `memories` table.
-   It filters out memories with `NULL` or empty `tags` arrays.
-   Results are ordered alphabetically. 