CREATE OR REPLACE FUNCTION get_recent_conversations(
    p_user_id uuid,
    p_limit integer DEFAULT 10
)
RETURNS TABLE (
    conversation_title text,
    latest_message_time timestamp with time zone,
    conversation_start_time timestamp with time zone -- Included for context
)
LANGUAGE sql STABLE
AS $$
WITH conversation_activity AS (
    SELECT
        m.conversation_title,
        MAX(m.create_time) AS max_message_time 
    FROM
        memories m
    WHERE
        m.user_id = p_user_id
        AND m.conversation_title IS NOT NULL
    GROUP BY
        m.conversation_title
),
conversation_details AS (
    SELECT DISTINCT ON (ca.conversation_title)
        ca.conversation_title,
        m.conversation_start_time
    FROM
        conversation_activity ca
    JOIN
        memories m ON ca.conversation_title = m.conversation_title AND m.create_time = ca.max_message_time AND m.user_id = p_user_id
    ORDER BY
        ca.conversation_title, m.created_at DESC 
)
SELECT
    ca.conversation_title,
    ca.max_message_time AS latest_message_time,
    cd.conversation_start_time
FROM
    conversation_activity ca
LEFT JOIN
    conversation_details cd ON ca.conversation_title = cd.conversation_title
ORDER BY
    latest_message_time DESC
LIMIT
    p_limit;
$$; 