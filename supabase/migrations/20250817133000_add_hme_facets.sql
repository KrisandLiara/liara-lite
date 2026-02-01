-- Stage 0b: Facet views and counts for hard_memory_entries (primary overview surface)

-- 1) Ensure NER storage & helpful indexes
ALTER TABLE public.hard_memory_entries
ADD COLUMN IF NOT EXISTS named_entities JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_hme_named_entities
  ON public.hard_memory_entries USING gin (named_entities);

CREATE INDEX IF NOT EXISTS idx_hme_keywords
  ON public.hard_memory_entries USING gin (keywords);

-- 2) Flattened views (user-scoped)

-- Keywords
CREATE OR REPLACE VIEW public.v_hme_keyword AS
SELECT h.id AS memory_id,
       h.user_id AS user_id,
       lower(trim(both '"' from k::text)) AS value
FROM public.hard_memory_entries h,
     unnest(COALESCE(h.keywords, ARRAY[]::text[])) AS k
WHERE k IS NOT NULL AND k <> '';

-- PERSON (accept PERSON or people)
CREATE OR REPLACE VIEW public.v_hme_entity_person AS
SELECT h.id AS memory_id,
       h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'PERSON', '[]'::jsonb)
         || COALESCE(h.named_entities->'people', '[]'::jsonb)
       ))) AS value
FROM public.hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

-- ORG (accept ORG or orgs)
CREATE OR REPLACE VIEW public.v_hme_entity_org AS
SELECT h.id AS memory_id,
       h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'ORG', '[]'::jsonb)
         || COALESCE(h.named_entities->'orgs', '[]'::jsonb)
       ))) AS value
FROM public.hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

-- PRODUCT (accept PRODUCT or products)
CREATE OR REPLACE VIEW public.v_hme_entity_product AS
SELECT h.id AS memory_id,
       h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'PRODUCT', '[]'::jsonb)
         || COALESCE(h.named_entities->'products', '[]'::jsonb)
       ))) AS value
FROM public.hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

-- LOCATION (merge LOC + GPE + locations)
CREATE OR REPLACE VIEW public.v_hme_entity_location AS
WITH ne AS (
  SELECT h.id,
         h.user_id,
         COALESCE(h.named_entities->'LOC', '[]'::jsonb)
         || COALESCE(h.named_entities->'GPE', '[]'::jsonb)
         || COALESCE(h.named_entities->'locations', '[]'::jsonb) AS locs
  FROM public.hard_memory_entries h
)
SELECT id AS memory_id,
       user_id,
       lower(trim(both '"' from jsonb_array_elements_text(locs))) AS value
FROM ne;

-- EVENT (accept EVENT or events)
CREATE OR REPLACE VIEW public.v_hme_entity_event AS
SELECT h.id AS memory_id,
       h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'EVENT', '[]'::jsonb)
         || COALESCE(h.named_entities->'events', '[]'::jsonb)
       ))) AS value
FROM public.hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

-- DATE (accept DATE or dates)
CREATE OR REPLACE VIEW public.v_hme_entity_date AS
SELECT h.id AS memory_id,
       h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'DATE', '[]'::jsonb)
         || COALESCE(h.named_entities->'dates', '[]'::jsonb)
       ))) AS value
FROM public.hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

-- MISC (accept MISC or misc)
CREATE OR REPLACE VIEW public.v_hme_entity_misc AS
SELECT h.id AS memory_id,
       h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'MISC', '[]'::jsonb)
         || COALESCE(h.named_entities->'misc', '[]'::jsonb)
       ))) AS value
FROM public.hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

-- YYYY-MM bucket based on created_at
CREATE OR REPLACE VIEW public.v_hme_date_bucket AS
SELECT h.id AS memory_id,
       h.user_id AS user_id,
       to_char(h.created_at, 'YYYY-MM') AS value
FROM public.hard_memory_entries h;

-- 3) Materialized rollup for fast counts
DROP MATERIALIZED VIEW IF EXISTS public.mv_hme_facet_counts;

CREATE MATERIALIZED VIEW public.mv_hme_facet_counts AS
SELECT 'keyword'::text AS bucket, value, user_id, count(*)::bigint AS freq
FROM public.v_hme_keyword GROUP BY value, user_id
UNION ALL
SELECT 'entity.person', value, user_id, count(*)::bigint FROM public.v_hme_entity_person GROUP BY value, user_id
UNION ALL
SELECT 'entity.org', value, user_id, count(*)::bigint FROM public.v_hme_entity_org GROUP BY value, user_id
UNION ALL
SELECT 'entity.product', value, user_id, count(*)::bigint FROM public.v_hme_entity_product GROUP BY value, user_id
UNION ALL
SELECT 'entity.location', value, user_id, count(*)::bigint FROM public.v_hme_entity_location GROUP BY value, user_id
UNION ALL
SELECT 'entity.event', value, user_id, count(*)::bigint FROM public.v_hme_entity_event GROUP BY value, user_id
UNION ALL
SELECT 'entity.date', value, user_id, count(*)::bigint FROM public.v_hme_entity_date GROUP BY value, user_id
UNION ALL
SELECT 'entity.misc', value, user_id, count(*)::bigint FROM public.v_hme_entity_misc GROUP BY value, user_id
UNION ALL
SELECT 'entity.date_bucket', value, user_id, count(*)::bigint FROM public.v_hme_date_bucket GROUP BY value, user_id;

CREATE INDEX IF NOT EXISTS idx_mv_hme_facet_counts_user_bucket_value
ON public.mv_hme_facet_counts (user_id, bucket, value);

REFRESH MATERIALIZED VIEW public.mv_hme_facet_counts;


