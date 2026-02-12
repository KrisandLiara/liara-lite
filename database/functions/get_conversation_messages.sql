CREATE OR REPLACE FUNCTION get_conversation_messages(
    p_user_id uuid,
    p_conversation_title text
)
RETURNS TABLE (
    id uuid,
    content text,
    role text,
    created_at timestamptz,
    -- Include any other relevant fields from the 'memories' table that ChatInterface might need
    conversation_title text -- Useful to confirm, though it's an input
)
LANGUAGE sql STABLE
AS $$
SELECT
    m.id,
    m.content,
    m.role,
    m.created_at,
    m.conversation_title
FROM
    memories m
WHERE
    m.user_id = p_user_id
    AND m.conversation_title = p_conversation_title
ORDER BY
    m.created_at ASC;
$$; 