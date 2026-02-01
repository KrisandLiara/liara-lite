CREATE OR REPLACE FUNCTION get_memory_overview_stats(p_user_id uuid)
RETURNS TABLE(
    total_memories bigint,
    memories_today bigint,
    memories_this_week bigint,
    memories_this_month bigint,
    average_importance real,
    distinct_tags_count bigint,
    distinct_topics_count bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
    week_start_date date;
    month_start_date date;
BEGIN
    week_start_date := date_trunc('week', CURRENT_DATE);
    month_start_date := date_trunc('month', CURRENT_DATE);

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM memories WHERE user_id = p_user_id) AS total_memories,
        (SELECT COUNT(*) FROM memories WHERE user_id = p_user_id AND created_at >= CURRENT_DATE) AS memories_today,
        (SELECT COUNT(*) FROM memories WHERE user_id = p_user_id AND created_at >= week_start_date) AS memories_this_week,
        (SELECT COUNT(*) FROM memories WHERE user_id = p_user_id AND created_at >= month_start_date) AS memories_this_month,
        (SELECT AVG(importance) FROM memories WHERE user_id = p_user_id) AS average_importance,
        (SELECT COUNT(DISTINCT t.tag) FROM memories m, unnest(m.tags) AS t(tag) WHERE m.user_id = p_user_id AND m.tags IS NOT NULL AND array_length(m.tags, 1) > 0) AS distinct_tags_count,
        (SELECT COUNT(DISTINCT metadata->>'topic') FROM memories WHERE user_id = p_user_id AND metadata->>'topic' IS NOT NULL) AS distinct_topics_count;
END;
$$; 