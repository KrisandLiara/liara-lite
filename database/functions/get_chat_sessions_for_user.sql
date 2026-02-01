CREATE OR REPLACE FUNCTION get_chat_sessions_for_user(
    p_user_id uuid,
    p_limit integer DEFAULT 15,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    guest_session_id uuid,
    title text,
    status text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    total_sessions bigint
)
LANGUAGE sql STABLE
AS $$
WITH user_sessions AS (
    SELECT
        cs.id,
        cs.user_id,
        cs.guest_session_id,
        cs.title,
        cs.status,
        cs.created_at,
        cs.updated_at
    FROM
        public.chat_sessions cs
    WHERE
        cs.user_id = p_user_id
    ORDER BY
        cs.updated_at DESC
),
sessions_count AS (
    SELECT count(*) as total_count FROM user_sessions
)
SELECT
    us.id,
    us.user_id,
    us.guest_session_id,
    us.title,
    us.status,
    us.created_at,
    us.updated_at,
    (SELECT total_count FROM sessions_count) AS total_sessions
FROM
    user_sessions us
LIMIT p_limit
OFFSET p_offset;
$$; 