-- Stage 0: Facet views and counts for test_memories (safe, idempotent)
-- This migration prepares the data layer for the Tag Cloud / Memory Overview.
-- It targets ONLY the test_memories table to keep prod untouched while we iterate.

-- 1) Ensure named_entities exists on test_memories (in case prior migration hasn't run)
ALTER TABLE public.test_memories
ADD COLUMN IF NOT EXISTS named_entities JSONB DEFAULT '{}'::jsonb;

-- Helpful index for JSONB existence/contains queries on entities
CREATE INDEX IF NOT EXISTS idx_test_memories_named_entities
ON public.test_memories USING gin (named_entities);

-- 2) Flattened facet views (keywords, entities, date buckets)

-- Keywords (tags) → one row per (memory_id, value)
CREATE OR REPLACE VIEW public.v_test_keyword AS
SELECT tm.id AS memory_id,
       lower(trim(both '"' from k::text)) AS value
FROM public.test_memories tm,
     unnest(COALESCE(tm.tags, ARRAY[]::text[])) AS k
WHERE k IS NOT NULL AND k <> '';

-- Helper: extract a jsonb array by key safely (returns empty array if missing)
-- Note: using inline coalesce patterns in each view to avoid dependency on a separate function

-- PERSON
CREATE OR REPLACE VIEW public.v_test_entity_person AS
SELECT tm.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'PERSON', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

-- ORG
CREATE OR REPLACE VIEW public.v_test_entity_org AS
SELECT tm.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'ORG', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

-- PRODUCT
CREATE OR REPLACE VIEW public.v_test_entity_product AS
SELECT tm.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'PRODUCT', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

-- LOCATION (merge LOC and GPE if either is present)
CREATE OR REPLACE VIEW public.v_test_entity_location AS
WITH ne AS (
  SELECT tm.id,
         COALESCE(tm.named_entities->'LOC', '[]'::jsonb) || COALESCE(tm.named_entities->'GPE', '[]'::jsonb) AS locs
  FROM public.test_memories tm
)
SELECT id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(locs))) AS value
FROM ne;

-- EVENT
CREATE OR REPLACE VIEW public.v_test_entity_event AS
SELECT tm.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'EVENT', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

-- DATE (raw entity strings, not buckets)
CREATE OR REPLACE VIEW public.v_test_entity_date AS
SELECT tm.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'DATE', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

-- MISC
CREATE OR REPLACE VIEW public.v_test_entity_misc AS
SELECT tm.id AS memory_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'MISC', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

-- YYYY-MM bucket based on timestamp/created_at (prefer timestamp)
CREATE OR REPLACE VIEW public.v_test_date_bucket AS
SELECT tm.id AS memory_id,
       to_char(COALESCE(tm."timestamp", tm.created_at), 'YYYY-MM') AS value
FROM public.test_memories tm;

COMMENT ON VIEW public.v_test_keyword IS 'Flattened keywords (tags) from test_memories';
COMMENT ON VIEW public.v_test_entity_person IS 'Flattened PERSON entities from test_memories.named_entities';
COMMENT ON VIEW public.v_test_entity_org IS 'Flattened ORG entities from test_memories.named_entities';
COMMENT ON VIEW public.v_test_entity_product IS 'Flattened PRODUCT entities from test_memories.named_entities';
COMMENT ON VIEW public.v_test_entity_location IS 'Flattened LOCATION entities (LOC + GPE) from test_memories.named_entities';
COMMENT ON VIEW public.v_test_entity_event IS 'Flattened EVENT entities from test_memories.named_entities';
COMMENT ON VIEW public.v_test_entity_date IS 'Flattened DATE entities from test_memories.named_entities';
COMMENT ON VIEW public.v_test_entity_misc IS 'Flattened MISC entities from test_memories.named_entities';
COMMENT ON VIEW public.v_test_date_bucket IS 'YYYY-MM buckets derived from timestamp/created_at';

-- 3) Materialized rollup for fast facet counts
-- Re-create to allow safe re-runs
DROP MATERIALIZED VIEW IF EXISTS public.mv_test_facet_counts;

CREATE MATERIALIZED VIEW public.mv_test_facet_counts AS
SELECT 'keyword'::text AS bucket, value, count(*)::bigint AS freq
FROM public.v_test_keyword GROUP BY value
UNION ALL
SELECT 'entity.person', value, count(*)::bigint FROM public.v_test_entity_person GROUP BY value
UNION ALL
SELECT 'entity.org', value, count(*)::bigint FROM public.v_test_entity_org GROUP BY value
UNION ALL
SELECT 'entity.product', value, count(*)::bigint FROM public.v_test_entity_product GROUP BY value
UNION ALL
SELECT 'entity.location', value, count(*)::bigint FROM public.v_test_entity_location GROUP BY value
UNION ALL
SELECT 'entity.event', value, count(*)::bigint FROM public.v_test_entity_event GROUP BY value
UNION ALL
SELECT 'entity.date', value, count(*)::bigint FROM public.v_test_entity_date GROUP BY value
UNION ALL
SELECT 'entity.misc', value, count(*)::bigint FROM public.v_test_entity_misc GROUP BY value
UNION ALL
SELECT 'entity.date_bucket', value, count(*)::bigint FROM public.v_test_date_bucket GROUP BY value;

-- Helpful index for lookups by bucket/value
CREATE INDEX IF NOT EXISTS idx_mv_test_facet_counts_bucket_value
ON public.mv_test_facet_counts (bucket, value);

COMMENT ON MATERIALIZED VIEW public.mv_test_facet_counts IS 'Precomputed counts for facets across test_memories (keywords, NER, date buckets).';

-- 4) Optional: initial refresh to populate counts (safe if empty)
-- Note: CONCURRENTLY requires the MV to already exist; first build runs without it.
REFRESH MATERIALIZED VIEW public.mv_test_facet_counts;


