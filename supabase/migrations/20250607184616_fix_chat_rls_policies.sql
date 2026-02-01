-- Enable RLS and define policies for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow full access to own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON public.chat_sessions;

-- Policy: Allow users to manage (select, insert, update, delete) their own chat sessions
CREATE POLICY "Allow full access to own chat sessions"
ON public.chat_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS and define policies for chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow full access to own chat history" ON public.chat_history;

-- Policy: Allow users to manage their own chat history records
CREATE POLICY "Allow full access to own chat history"
ON public.chat_history
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM chat_sessions cs
    WHERE cs.id = chat_history.chat_session_id AND cs.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM chat_sessions cs
    WHERE cs.id = chat_history.chat_session_id AND cs.user_id = auth.uid()
  )
);
