CREATE OR REPLACE FUNCTION get_distinct_tags(p_user_id uuid)
RETURNS TABLE (tag text)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT unnest(tags) as tag
    FROM memories
    WHERE user_id = p_user_id AND tags IS NOT NULL AND array_length(tags, 1) > 0
    ORDER BY tag;
END;
$$; 