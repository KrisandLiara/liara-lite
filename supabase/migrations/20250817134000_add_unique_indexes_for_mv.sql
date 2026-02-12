-- Ensure unique indexes exist so we can REFRESH MATERIALIZED VIEW CONCURRENTLY

-- hard_memory_entries facets MV
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_hme_facet_counts_unique
ON public.mv_hme_facet_counts (user_id, bucket, value);

-- memories facets MV
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_mem_facet_counts_unique
ON public.mv_mem_facet_counts (user_id, bucket, value);

-- test_memories facets MV
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_test_facet_counts_unique
ON public.mv_test_facet_counts (user_id, bucket, value);


