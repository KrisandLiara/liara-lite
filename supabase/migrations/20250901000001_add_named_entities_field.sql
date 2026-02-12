-- Add named_entities field to support Named Entity Recognition (NER)
-- This will store extracted entities like people, places, organizations, dates, etc.

-- Add to memories table (main production table)
ALTER TABLE public.memories
ADD COLUMN IF NOT EXISTS named_entities JSONB DEFAULT '{}'::jsonb;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_memories_named_entities
ON public.memories USING gin (named_entities);

-- Add helpful comment
COMMENT ON COLUMN public.memories.named_entities IS 
'JSONB field storing extracted named entities: {PERSON: [], ORG: [], GPE: [], DATE: [], PRODUCT: [], EVENT: [], MISC: []}'; 