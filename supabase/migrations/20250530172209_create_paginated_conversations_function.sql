-- supabase/migrations/20250530172209_create_paginated_conversations_function.sql
-- (The actual timestamp in your filename will vary)

CREATE OR REPLACE FUNCTION get_paginated_conversations_for_user(
    p_user_id UUID,
    p_limit INT,
    p_offset INT
)
RETURNS TABLE (
    id UUID, -- Representative memory ID for the conversation
    conversation_title TEXT,
    conversation_start_time TIMESTAMPTZ,
    latest_message_time TIMESTAMPTZ,
    user_id UUID,
    total_valid_conversations BIGINT
)
LANGUAGE sql
STABLE
AS $$
WITH valid_conversation_titles AS (
    -- First, identify conversation titles that meet the "good structure" criteria
    SELECT
        m.conversation_title,
        m.user_id,
        MAX(COALESCE(m.timestamp, m.created_at)) as latest_message_time_for_group
    FROM
        memories m
    WHERE
        m.user_id = p_user_id
        AND m.conversation_title IS NOT NULL AND m.conversation_title <> ''
    GROUP BY
        m.conversation_title, m.user_id
    HAVING
        -- Condition for at least one valid user message in the group
        BOOL_OR(m.role = 'user' AND m.content IS NOT NULL AND m.content <> '') IS TRUE
        AND
        -- Condition for at least one valid assistant message in the group
        BOOL_OR(m.role = 'assistant' AND m.content IS NOT NULL AND m.content <> '') IS TRUE
),
ranked_memories_for_id AS (
    -- For each valid conversation, rank memories to pick the earliest one as representative
    SELECT
        m.id as representative_memory_id,
        m.conversation_title,
        m.created_at as first_message_created_at,
        ROW_NUMBER() OVER (PARTITION BY m.conversation_title ORDER BY m.created_at ASC, m.id ASC) as rn
    FROM
        memories m
    INNER JOIN -- Only consider memories from valid conversation titles
        valid_conversation_titles vct ON m.conversation_title = vct.conversation_title AND m.user_id = vct.user_id
),
final_conversation_details AS (
    -- Combine valid titles with their representative ID and calculated times
    SELECT
        rm.representative_memory_id AS id,
        vct.conversation_title,
        rm.first_message_created_at AS conversation_start_time,
        vct.latest_message_time_for_group AS latest_message_time,
        vct.user_id
    FROM
        valid_conversation_titles vct
    INNER JOIN
        ranked_memories_for_id rm ON vct.conversation_title = rm.conversation_title AND rm.rn = 1
)
-- Final selection with pagination and total count of all valid conversations for the user
SELECT
    fcd.id,
    fcd.conversation_title,
    fcd.conversation_start_time,
    fcd.latest_message_time,
    fcd.user_id,
    (SELECT COUNT(*) FROM final_conversation_details) AS total_valid_conversations
FROM
    final_conversation_details fcd
ORDER BY
    fcd.latest_message_time DESC, fcd.id DESC -- Secondary sort for stable order
LIMIT p_limit
OFFSET p_offset;
$$;
