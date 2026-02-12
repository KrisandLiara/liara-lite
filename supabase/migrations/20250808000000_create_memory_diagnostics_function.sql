CREATE OR REPLACE FUNCTION get_memory_diagnostics(p_user_id UUID)
RETURNS TABLE(total_memories BIGINT, embedded_memories BIGINT, missing_embeddings BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) AS total_memories,
        COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) AS embedded_memories,
        COUNT(CASE WHEN embedding IS NULL THEN 1 END) AS missing_embeddings
    FROM
        memories
    WHERE
        user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 