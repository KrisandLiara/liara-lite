-- Recreate facet views with user_id column (safe redefinition)
-- Drop MVs first, then views, then create views with user_id, then rebuild MVs

-- 1) Drop materialized views if they exist
DROP MATERIALIZED VIEW IF EXISTS public.mv_test_facet_counts;
DROP MATERIALIZED VIEW IF EXISTS public.mv_mem_facet_counts;

-- 2) Drop existing test views (if present)
DROP VIEW IF EXISTS public.v_test_keyword;
DROP VIEW IF EXISTS public.v_test_entity_person;
DROP VIEW IF EXISTS public.v_test_entity_org;
DROP VIEW IF EXISTS public.v_test_entity_product;
DROP VIEW IF EXISTS public.v_test_entity_location;
DROP VIEW IF EXISTS public.v_test_entity_event;
DROP VIEW IF EXISTS public.v_test_entity_date;
DROP VIEW IF EXISTS public.v_test_entity_misc;
DROP VIEW IF EXISTS public.v_test_date_bucket;

-- 3) Create TEST views with user_id
CREATE VIEW public.v_test_keyword AS
SELECT tm.id AS memory_id,
       tm.user_id AS user_id,
       lower(trim(both '"' from k::text)) AS value
FROM public.test_memories tm,
     unnest(COALESCE(tm.tags, ARRAY[]::text[])) AS k
WHERE k IS NOT NULL AND k <> '';

CREATE VIEW public.v_test_entity_person AS
SELECT tm.id AS memory_id,
       tm.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'PERSON', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

CREATE VIEW public.v_test_entity_org AS
SELECT tm.id AS memory_id,
       tm.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'ORG', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

CREATE VIEW public.v_test_entity_product AS
SELECT tm.id AS memory_id,
       tm.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'PRODUCT', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

CREATE VIEW public.v_test_entity_location AS
WITH ne AS (
  SELECT tm.id,
         tm.user_id,
         COALESCE(tm.named_entities->'LOC', '[]'::jsonb) || COALESCE(tm.named_entities->'GPE', '[]'::jsonb) AS locs
  FROM public.test_memories tm
)
SELECT id AS memory_id,
       user_id,
       lower(trim(both '"' from jsonb_array_elements_text(locs))) AS value
FROM ne;

CREATE VIEW public.v_test_entity_event AS
SELECT tm.id AS memory_id,
       tm.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'EVENT', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

CREATE VIEW public.v_test_entity_date AS
SELECT tm.id AS memory_id,
       tm.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'DATE', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

CREATE VIEW public.v_test_entity_misc AS
SELECT tm.id AS memory_id,
       tm.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(tm.named_entities->'MISC', '[]'::jsonb)))) AS value
FROM public.test_memories tm
WHERE tm.named_entities IS NOT NULL;

CREATE VIEW public.v_test_date_bucket AS
SELECT tm.id AS memory_id,
       tm.user_id AS user_id,
       to_char(COALESCE(tm."timestamp", tm.created_at), 'YYYY-MM') AS value
FROM public.test_memories tm;

-- 4) Rebuild TEST MV
CREATE MATERIALIZED VIEW public.mv_test_facet_counts AS
SELECT 'keyword'::text AS bucket, value, user_id, count(*)::bigint AS freq
FROM public.v_test_keyword GROUP BY value, user_id
UNION ALL
SELECT 'entity.person', value, user_id, count(*)::bigint FROM public.v_test_entity_person GROUP BY value, user_id
UNION ALL
SELECT 'entity.org', value, user_id, count(*)::bigint FROM public.v_test_entity_org GROUP BY value, user_id
UNION ALL
SELECT 'entity.product', value, user_id, count(*)::bigint FROM public.v_test_entity_product GROUP BY value, user_id
UNION ALL
SELECT 'entity.location', value, user_id, count(*)::bigint FROM public.v_test_entity_location GROUP BY value, user_id
UNION ALL
SELECT 'entity.event', value, user_id, count(*)::bigint FROM public.v_test_entity_event GROUP BY value, user_id
UNION ALL
SELECT 'entity.date', value, user_id, count(*)::bigint FROM public.v_test_entity_date GROUP BY value, user_id
UNION ALL
SELECT 'entity.misc', value, user_id, count(*)::bigint FROM public.v_test_entity_misc GROUP BY value, user_id
UNION ALL
SELECT 'entity.date_bucket', value, user_id, count(*)::bigint FROM public.v_test_date_bucket GROUP BY value, user_id;

CREATE INDEX IF NOT EXISTS idx_mv_test_facet_counts_user_bucket_value
ON public.mv_test_facet_counts (user_id, bucket, value);

REFRESH MATERIALIZED VIEW public.mv_test_facet_counts;

-- 5) Drop existing prod views (if present)
DROP VIEW IF EXISTS public.v_mem_keyword;
DROP VIEW IF EXISTS public.v_mem_entity_person;
DROP VIEW IF EXISTS public.v_mem_entity_org;
DROP VIEW IF EXISTS public.v_mem_entity_product;
DROP VIEW IF EXISTS public.v_mem_entity_location;
DROP VIEW IF EXISTS public.v_mem_entity_event;
DROP VIEW IF EXISTS public.v_mem_entity_date;
DROP VIEW IF EXISTS public.v_mem_entity_misc;
DROP VIEW IF EXISTS public.v_mem_date_bucket;

-- 6) Create PROD views with user_id
CREATE VIEW public.v_mem_keyword AS
SELECT m.id AS memory_id,
       m.user_id AS user_id,
       lower(trim(both '"' from k::text)) AS value
FROM public.memories m,
     unnest(COALESCE(m.tags, ARRAY[]::text[])) AS k
WHERE k IS NOT NULL AND k <> '';

CREATE VIEW public.v_mem_entity_person AS
SELECT m.id AS memory_id,
       m.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'PERSON', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

CREATE VIEW public.v_mem_entity_org AS
SELECT m.id AS memory_id,
       m.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'ORG', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

CREATE VIEW public.v_mem_entity_product AS
SELECT m.id AS memory_id,
       m.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'PRODUCT', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

CREATE VIEW public.v_mem_entity_location AS
WITH ne AS (
  SELECT m.id,
         m.user_id,
         COALESCE(m.named_entities->'LOC', '[]'::jsonb) || COALESCE(m.named_entities->'GPE', '[]'::jsonb) AS locs
  FROM public.memories m
)
SELECT id AS memory_id,
       user_id,
       lower(trim(both '"' from jsonb_array_elements_text(locs))) AS value
FROM ne;

CREATE VIEW public.v_mem_entity_event AS
SELECT m.id AS memory_id,
       m.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'EVENT', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

CREATE VIEW public.v_mem_entity_date AS
SELECT m.id AS memory_id,
       m.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'DATE', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

CREATE VIEW public.v_mem_entity_misc AS
SELECT m.id AS memory_id,
       m.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(COALESCE(m.named_entities->'MISC', '[]'::jsonb)))) AS value
FROM public.memories m
WHERE m.named_entities IS NOT NULL;

CREATE VIEW public.v_mem_date_bucket AS
SELECT m.id AS memory_id,
       m.user_id AS user_id,
       to_char(COALESCE(m."timestamp", m.created_at), 'YYYY-MM') AS value
FROM public.memories m;

-- 7) Rebuild PROD MV
CREATE MATERIALIZED VIEW public.mv_mem_facet_counts AS
SELECT 'keyword'::text AS bucket, value, user_id, count(*)::bigint AS freq
FROM public.v_mem_keyword GROUP BY value, user_id
UNION ALL
SELECT 'entity.person', value, user_id, count(*)::bigint FROM public.v_mem_entity_person GROUP BY value, user_id
UNION ALL
SELECT 'entity.org', value, user_id, count(*)::bigint FROM public.v_mem_entity_org GROUP BY value, user_id
UNION ALL
SELECT 'entity.product', value, user_id, count(*)::bigint FROM public.v_mem_entity_product GROUP BY value, user_id
UNION ALL
SELECT 'entity.location', value, user_id, count(*)::bigint FROM public.v_mem_entity_location GROUP BY value, user_id
UNION ALL
SELECT 'entity.event', value, user_id, count(*)::bigint FROM public.v_mem_entity_event GROUP BY value, user_id
UNION ALL
SELECT 'entity.date', value, user_id, count(*)::bigint FROM public.v_mem_entity_date GROUP BY value, user_id
UNION ALL
SELECT 'entity.misc', value, user_id, count(*)::bigint FROM public.v_mem_entity_misc GROUP BY value, user_id
UNION ALL
SELECT 'entity.date_bucket', value, user_id, count(*)::bigint FROM public.v_mem_date_bucket GROUP BY value, user_id;

CREATE INDEX IF NOT EXISTS idx_mv_mem_facet_counts_user_bucket_value
ON public.mv_mem_facet_counts (user_id, bucket, value);

REFRESH MATERIALIZED VIEW public.mv_mem_facet_counts;


