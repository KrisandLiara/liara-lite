-- Enable RLS on the memories table if it's not already.
-- This is idempotent and will not cause an error if RLS is already enabled.
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists to make this script re-runnable
DROP POLICY IF EXISTS "Users can view their own memories" ON public.memories;

-- Create the policy that allows users to select their own memories.
CREATE POLICY "Users can view their own memories"
ON public.memories
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- While we are at it, let's ensure users can also insert, update, and delete their own memories.

-- Drop policy if it exists to make this script re-runnable
DROP POLICY IF EXISTS "Users can insert their own memories" ON public.memories;

CREATE POLICY "Users can insert their own memories"
ON public.memories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Drop policy if it exists to make this script re-runnable
DROP POLICY IF EXISTS "Users can update their own memories" ON public.memories;

CREATE POLICY "Users can update their own memories"
ON public.memories
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Drop policy if it exists to make this script re-runnable
DROP POLICY IF EXISTS "Users can delete their own memories" ON public.memories;

CREATE POLICY "Users can delete their own memories"
ON public.memories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 