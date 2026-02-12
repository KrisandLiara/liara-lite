CREATE OR REPLACE FUNCTION get_all_user_tags(p_user_id uuid)
RETURNS TABLE(tag text, count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT
        unnest(tags) as tag,
        count(*) as count
    FROM
        memories
    WHERE
        user_id = p_user_id
    GROUP BY
        tag
    ORDER BY
        count DESC, tag ASC;
END;
$$ LANGUAGE plpgsql; 