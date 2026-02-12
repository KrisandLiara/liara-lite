CREATE OR REPLACE FUNCTION get_top_topics(p_user_id uuid, p_topic_limit integer DEFAULT 10)
RETURNS TABLE(topic text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(memories.metadata->>'topic', 'Untopiced') AS topic, COUNT(*) AS count
  FROM memories
  WHERE memories.user_id = p_user_id
  GROUP BY topic
  ORDER BY count DESC, topic ASC
  LIMIT p_topic_limit;
END;
$$; 