-- Function to get recent chat sessions for a user
CREATE OR REPLACE FUNCTION public.get_recent_chat_sessions_for_user(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 15
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    latest_message_time TIMESTAMPTZ, -- Using updated_at from chat_sessions
    conversation_start_time TIMESTAMPTZ -- Using created_at from chat_sessions
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.id,
        cs.title,
        cs.updated_at AS latest_message_time,
        cs.created_at AS conversation_start_time
    FROM
        public.chat_sessions cs
    WHERE
        cs.user_id = p_user_id
    ORDER BY
        cs.updated_at DESC
    LIMIT
        p_limit;
END;
$$; 