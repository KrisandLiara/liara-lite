CREATE OR REPLACE FUNCTION get_topic_cloud_data(
    p_user_id uuid,
    p_topic_limit integer DEFAULT 20
)
RETURNS TABLE(topic text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(memories.metadata->>'topic', 'Untopiced') AS topic_name,
    COUNT(*) AS topic_count
  FROM
    memories
  WHERE
    memories.user_id = p_user_id
  GROUP BY
    topic_name
  ORDER BY
    topic_count DESC, topic_name ASC
  LIMIT p_topic_limit;
END;
$$; 