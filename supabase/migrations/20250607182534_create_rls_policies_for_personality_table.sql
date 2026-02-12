-- Enable RLS for the personality table
ALTER TABLE public.personality ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read global default prompts (user_id IS NULL)
CREATE POLICY "Allow authenticated users to read global prompts"
ON public.personality
FOR SELECT
TO authenticated
USING (user_id IS NULL);

-- Policy: Allow users to manage (select, insert, update, delete) their own prompts
CREATE POLICY "Allow users to manage their own personality entries"
ON public.personality
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
