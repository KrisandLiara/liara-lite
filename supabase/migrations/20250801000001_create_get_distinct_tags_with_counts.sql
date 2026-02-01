CREATE OR REPLACE FUNCTION get_distinct_tags_with_counts(p_user_id uuid, p_tag_limit integer DEFAULT 10)
RETURNS TABLE(tag text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT unnested_tags.tag, COUNT(*) as count
  FROM memories, unnest(tags) AS unnested_tags(tag)
  WHERE memories.user_id = p_user_id AND memories.tags IS NOT NULL AND array_length(memories.tags, 1) > 0
  GROUP BY unnested_tags.tag
  ORDER BY count DESC, unnested_tags.tag ASC
  LIMIT p_tag_limit;
END;
$$; 