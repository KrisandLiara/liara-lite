-- Add indexes to improve query performance on the memories table.

-- Standard B-tree indexes for common filtering and sorting operations
CREATE INDEX IF NOT EXISTS idx_memories_user_id_created_at ON public.memories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_source ON public.memories(source);
CREATE INDEX IF NOT EXISTS idx_memories_type ON public.memories(type);

-- GIN index for efficient searching within the JSONB metadata
CREATE INDEX IF NOT EXISTS idx_memories_metadata_gin ON public.memories USING gin (metadata);

-- IVFFLAT index for vector similarity search on embeddings
-- This operation requires more memory than the default Supabase setting.
-- We temporarily increase maintenance_work_mem for this transaction.
SET LOCAL maintenance_work_mem = '128MB';
CREATE INDEX IF NOT EXISTS idx_memories_embedding_ivfflat ON public.memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
RESET maintenance_work_mem; 