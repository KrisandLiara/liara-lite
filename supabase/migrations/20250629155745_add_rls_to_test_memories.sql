ALTER TABLE public.test_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to see their own test memories"
ON public.test_memories
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
