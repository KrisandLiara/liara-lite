CREATE OR REPLACE FUNCTION get_distinct_tags_with_counts(
    p_user_id uuid,
    p_table_name text,
    p_tag_limit integer DEFAULT 20
)
RETURNS TABLE(tag text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT unnested_tags.tag, COUNT(*) as count
     FROM %I, unnest(tags) AS unnested_tags(tag)
     WHERE user_id = %L AND tags IS NOT NULL AND array_length(tags, 1) > 0
     GROUP BY unnested_tags.tag
     ORDER BY count DESC, unnested_tags.tag ASC
     LIMIT %L',
    p_table_name, p_user_id, p_tag_limit
  );
END;
$$; 