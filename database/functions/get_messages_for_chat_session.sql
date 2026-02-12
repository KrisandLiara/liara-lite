CREATE OR REPLACE FUNCTION get_messages_for_chat_session(
    p_chat_session_id uuid,
    p_limit integer DEFAULT 20, -- Or your preferred page size for messages
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    chat_session_id uuid,
    user_id uuid,
    guest_session_id uuid,
    role text,
    content text,
    created_at timestamp with time zone,
    metadata jsonb,
    total_messages bigint
)
LANGUAGE sql STABLE
AS $$
WITH session_messages AS (
    SELECT
        ch.id,
        ch.chat_session_id,
        ch.user_id,
        ch.guest_session_id,
        ch.role,
        ch.content,
        ch.created_at,
        ch.metadata
    FROM
        public.chat_history ch
    WHERE
        ch.chat_session_id = p_chat_session_id
    ORDER BY
        ch.created_at ASC -- Typically messages are shown oldest first in a conversation
),
message_count AS (
    SELECT count(*) as total_count FROM session_messages
)
SELECT
    sm.id,
    sm.chat_session_id,
    sm.user_id,
    sm.guest_session_id,
    sm.role,
    sm.content,
    sm.created_at,
    sm.metadata,
    (SELECT total_count FROM message_count) AS total_messages
FROM
    session_messages sm
LIMIT p_limit
OFFSET p_offset;
$$; 