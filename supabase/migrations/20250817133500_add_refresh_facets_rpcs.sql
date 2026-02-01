-- RPCs to refresh materialized views safely from the API layer

CREATE OR REPLACE FUNCTION public.refresh_hme_facets()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hme_facet_counts;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_hme_facets() TO authenticated;

CREATE OR REPLACE FUNCTION public.refresh_sem_facets()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_mem_facet_counts;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_test_facet_counts;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_sem_facets() TO authenticated;


