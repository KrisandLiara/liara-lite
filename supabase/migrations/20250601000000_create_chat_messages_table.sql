CREATE TABLE "public"."chat_history" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "chat_session_id" uuid NOT NULL,
    "user_id" uuid, -- Can be NULL if guest_session_id is used
    "guest_session_id" uuid, -- Can be NULL if user_id is used
    "role" text NOT NULL, -- e.g., 'user', 'assistant', 'system'
    "content" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "metadata" jsonb,
    CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_history_chat_session_id_fkey" FOREIGN KEY (chat_session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    CONSTRAINT "chat_history_role_check" CHECK (role IN ('user', 'assistant', 'system'))
);

-- Add indexes for columns that will be frequently queried
CREATE INDEX IF NOT EXISTS idx_chat_history_chat_session_id ON public.chat_history(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_guest_session_id ON public.chat_history(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at);

-- Enable Row Level Security (RLS) if you plan to use it
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (you'll need to customize these based on your auth rules):
-- Allow users to see their own messages or messages in their sessions.
CREATE POLICY "Users can view their own chat history"
ON public.chat_history FOR SELECT
USING (
  (auth.uid() = user_id) OR
  EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    WHERE cs.id = chat_session_id AND (cs.user_id = auth.uid()) -- Simplified for now, guest logic needs care
  )
);

CREATE POLICY "Users can insert their own chat history"
ON public.chat_history FOR INSERT
WITH CHECK (
  (auth.uid() = user_id AND guest_session_id IS NULL) OR
  (user_id IS NULL AND guest_session_id IS NOT NULL) -- Simplified, ensure guest_session_id is validated
);

-- Consider constraints for user_id/guest_session_id exclusivity if needed, e.g.:
-- ALTER TABLE public.chat_history
-- ADD CONSTRAINT check_user_or_guest_exclusive
-- CHECK ((user_id IS NOT NULL AND guest_session_id IS NULL) OR (user_id IS NULL AND guest_session_id IS NOT NULL) OR (user_id IS NULL AND guest_session_id IS NULL));
-- The last OR allows for system messages not tied to a user/guest directly in this table if chat_session_id provides enough context.
-- Or, ensure one is always NOT NULL if every message must have an owner. 