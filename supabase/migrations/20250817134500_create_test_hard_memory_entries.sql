-- Create test_hard_memory_entries table (no FK to chat_sessions to avoid seeding friction)

CREATE TABLE IF NOT EXISTS public.test_hard_memory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  source_chat_id uuid,
  fact text NOT NULL,
  topic text,
  keywords text[],
  importance integer DEFAULT 5,
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  named_entities jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_thme_keywords ON public.test_hard_memory_entries USING gin (keywords);
CREATE INDEX IF NOT EXISTS idx_thme_named_entities ON public.test_hard_memory_entries USING gin (named_entities);

-- Views (user-scoped) for test_hard_memory_entries

CREATE OR REPLACE VIEW public.v_thme_keyword AS
SELECT h.id AS memory_id, h.user_id AS user_id,
       lower(trim(both '"' from k::text)) AS value
FROM public.test_hard_memory_entries h,
     unnest(COALESCE(h.keywords, ARRAY[]::text[])) AS k
WHERE k IS NOT NULL AND k <> '';

CREATE OR REPLACE VIEW public.v_thme_entity_person AS
SELECT h.id AS memory_id, h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'PERSON','[]'::jsonb) || COALESCE(h.named_entities->'people','[]'::jsonb)
       ))) AS value
FROM public.test_hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

CREATE OR REPLACE VIEW public.v_thme_entity_org AS
SELECT h.id AS memory_id, h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'ORG','[]'::jsonb) || COALESCE(h.named_entities->'orgs','[]'::jsonb)
       ))) AS value
FROM public.test_hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

CREATE OR REPLACE VIEW public.v_thme_entity_product AS
SELECT h.id AS memory_id, h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'PRODUCT','[]'::jsonb) || COALESCE(h.named_entities->'products','[]'::jsonb)
       ))) AS value
FROM public.test_hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

CREATE OR REPLACE VIEW public.v_thme_entity_location AS
WITH ne AS (
  SELECT h.id, h.user_id,
         COALESCE(h.named_entities->'LOC','[]'::jsonb) || COALESCE(h.named_entities->'GPE','[]'::jsonb) || COALESCE(h.named_entities->'locations','[]'::jsonb) AS locs
  FROM public.test_hard_memory_entries h
)
SELECT id AS memory_id, user_id,
       lower(trim(both '"' from jsonb_array_elements_text(locs))) AS value
FROM ne;

CREATE OR REPLACE VIEW public.v_thme_entity_event AS
SELECT h.id AS memory_id, h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'EVENT','[]'::jsonb) || COALESCE(h.named_entities->'events','[]'::jsonb)
       ))) AS value
FROM public.test_hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

CREATE OR REPLACE VIEW public.v_thme_entity_date AS
SELECT h.id AS memory_id, h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'DATE','[]'::jsonb) || COALESCE(h.named_entities->'dates','[]'::jsonb)
       ))) AS value
FROM public.test_hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

CREATE OR REPLACE VIEW public.v_thme_entity_misc AS
SELECT h.id AS memory_id, h.user_id AS user_id,
       lower(trim(both '"' from jsonb_array_elements_text(
         COALESCE(h.named_entities->'MISC','[]'::jsonb) || COALESCE(h.named_entities->'misc','[]'::jsonb)
       ))) AS value
FROM public.test_hard_memory_entries h
WHERE h.named_entities IS NOT NULL;

CREATE OR REPLACE VIEW public.v_thme_date_bucket AS
SELECT h.id AS memory_id, h.user_id AS user_id,
       to_char(h.created_at, 'YYYY-MM') AS value
FROM public.test_hard_memory_entries h;

-- Materialized counts for test hard
DROP MATERIALIZED VIEW IF EXISTS public.mv_test_hme_facet_counts;

CREATE MATERIALIZED VIEW public.mv_test_hme_facet_counts AS
SELECT 'keyword'::text AS bucket, value, user_id, count(*)::bigint AS freq FROM public.v_thme_keyword GROUP BY value, user_id
UNION ALL
SELECT 'entity.person', value, user_id, count(*)::bigint FROM public.v_thme_entity_person GROUP BY value, user_id
UNION ALL
SELECT 'entity.org', value, user_id, count(*)::bigint FROM public.v_thme_entity_org GROUP BY value, user_id
UNION ALL
SELECT 'entity.product', value, user_id, count(*)::bigint FROM public.v_thme_entity_product GROUP BY value, user_id
UNION ALL
SELECT 'entity.location', value, user_id, count(*)::bigint FROM public.v_thme_entity_location GROUP BY value, user_id
UNION ALL
SELECT 'entity.event', value, user_id, count(*)::bigint FROM public.v_thme_entity_event GROUP BY value, user_id
UNION ALL
SELECT 'entity.date', value, user_id, count(*)::bigint FROM public.v_thme_entity_date GROUP BY value, user_id
UNION ALL
SELECT 'entity.misc', value, user_id, count(*)::bigint FROM public.v_thme_entity_misc GROUP BY value, user_id
UNION ALL
SELECT 'entity.date_bucket', value, user_id, count(*)::bigint FROM public.v_thme_date_bucket GROUP BY value, user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_test_hme_facet_counts_unique
ON public.mv_test_hme_facet_counts (user_id, bucket, value);

REFRESH MATERIALIZED VIEW public.mv_test_hme_facet_counts;

-- RPC to refresh test hard MV
CREATE OR REPLACE FUNCTION public.refresh_test_hme_facets()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_test_hme_facet_counts;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_test_hme_facets() TO authenticated;


