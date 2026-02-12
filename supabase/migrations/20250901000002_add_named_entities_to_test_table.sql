-- Add named_entities field to test_memories table to match production memories table
-- This ensures test mode has the same NER functionality

-- Add to test_memories table
ALTER TABLE public.test_memories 
ADD COLUMN IF NOT EXISTS named_entities JSONB DEFAULT '{}'::jsonb;

-- Add index for entity searches
CREATE INDEX IF NOT EXISTS idx_test_memories_named_entities 
ON public.test_memories USING gin (named_entities);

-- Add comment for documentation
COMMENT ON COLUMN public.test_memories.named_entities IS 
'JSONB field storing extracted named entities: {PERSON: [], ORG: [], GPE: [], DATE: [], PRODUCT: [], EVENT: [], MISC: []}'; 