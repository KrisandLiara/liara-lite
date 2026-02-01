-- Stage 0 (prod mirror): Facet views and counts for memories (idempotent)
-- This mirrors the test_memories facet layer for the production table.

-- 1) Ensure named_entities exists on memories (safe if prior migration ran)
ALTER TABLE public.memories
ADD COLUMN IF NOT EXISTS named_entities JSONB DEFAULT '{}'::jsonb;

-- Helpful index for JSONB lookups
CREATE INDEX IF NOT EXISTS idx_memories_named_entities
ON public.memories USING gin (named_entities);

-- 2) Flattened facet views

-- Keywords (tags)
CREATE OR REPLACE VIEW public.v_mem_keyword AS
SELECT m.id AS memory_id,
       lower(trim(both '"' from k::text)) AS value
FROM public.memories m,
     unnest(COALESCE(m.tags, ARRAY[]::text[])) AS k
WHERE k IS NOT NULL AND k <> '';

-- PERSON
CREATE OR REPLACE VIEW public.v_mem_entity_person AS
SELECT m.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'PERSON', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

-- ORG
CREATE OR REPLACE VIEW public.v_mem_entity_org AS
SELECT m.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'ORG', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

-- PRODUCT
CREATE OR REPLACE VIEW public.v_mem_entity_product AS
SELECT m.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'PRODUCT', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

-- LOCATION (LOC + GPE)
CREATE OR REPLACE VIEW public.v_mem_entity_location AS
WITH ne AS (
  SELECT m.id,
         COALESCE(m.named_entities->'LOC', '[]'::jsonb) || COALESCE(m.named_entities->'GPE', '[]'::jsonb) AS locs
  FROM public.memories m
)
SELECT id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(locs))) AS value
FROM ne;

-- EVENT
CREATE OR REPLACE VIEW public.v_mem_entity_event AS
SELECT m.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'EVENT', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

-- DATE (raw strings)
CREATE OR REPLACE VIEW public.v_mem_entity_date AS
SELECT m.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'DATE', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

-- MISC
CREATE OR REPLACE VIEW public.v_mem_entity_misc AS
SELECT m.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'MISC', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

-- YYYY-MM bucket
CREATE OR REPLACE VIEW public.v_mem_date_bucket AS
SELECT m.id AS memory_id,
       to_char(COALESCE(m."timestamp", m.created_at), 'YYYY-MM') AS value
FROM public.memories m;

COMMENT ON VIEW public.v_mem_keyword IS 'Flattened keywords (tags) from memories';
COMMENT ON VIEW public.v_mem_entity_person IS 'Flattened PERSON entities from memories.named_entities';
COMMENT ON VIEW public.v_mem_entity_org IS 'Flattened ORG entities from memories.named_entities';
COMMENT ON VIEW public.v_mem_entity_product IS 'Flattened PRODUCT entities from memories.named_entities';
COMMENT ON VIEW public.v_mem_entity_location IS 'Flattened LOCATION entities (LOC + GPE) from memories.named_entities';
COMMENT ON VIEW public.v_mem_entity_event IS 'Flattened EVENT entities from memories.named_entities';
COMMENT ON VIEW public.v_mem_entity_date IS 'Flattened DATE entities from memories.named_entities';
COMMENT ON VIEW public.v_mem_entity_misc IS 'Flattened MISC entities from memories.named_entities';
COMMENT ON VIEW public.v_mem_date_bucket IS 'YYYY-MM buckets derived from timestamp/created_at';

-- 3) Materialized rollup for fast facet counts
DROP MATERIALIZED VIEW IF EXISTS public.mv_mem_facet_counts;

CREATE MATERIALIZED VIEW public.mv_mem_facet_counts AS
SELECT 'keyword'::text AS bucket, value, count(*)::bigint AS freq
FROM public.v_mem_keyword GROUP BY value
UNION ALL
SELECT 'entity.person', value, count(*)::bigint FROM public.v_mem_entity_person GROUP BY value
UNION ALL
SELECT 'entity.org', value, count(*)::bigint FROM public.v_mem_entity_org GROUP BY value
UNION ALL
SELECT 'entity.product', value, count(*)::bigint FROM public.v_mem_entity_product GROUP BY value
UNION ALL
SELECT 'entity.location', value, count(*)::bigint FROM public.v_mem_entity_location GROUP BY value
UNION ALL
SELECT 'entity.event', value, count(*)::bigint FROM public.v_mem_entity_event GROUP BY value
UNION ALL
SELECT 'entity.date', value, count(*)::bigint FROM public.v_mem_entity_date GROUP BY value
UNION ALL
SELECT 'entity.misc', value, count(*)::bigint FROM public.v_mem_entity_misc GROUP BY value
UNION ALL
SELECT 'entity.date_bucket', value, count(*)::bigint FROM public.v_mem_date_bucket GROUP BY value;

CREATE INDEX IF NOT EXISTS idx_mv_mem_facet_counts_bucket_value
ON public.mv_mem_facet_counts (bucket, value);

COMMENT ON MATERIALIZED VIEW public.mv_mem_facet_counts IS 'Precomputed counts for facets across memories (keywords, NER, date buckets).';

-- Initial refresh
REFRESH MATERIALIZED VIEW public.mv_mem_facet_counts;


