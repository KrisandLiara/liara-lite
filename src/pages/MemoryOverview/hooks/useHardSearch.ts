import { useQuery } from '@tanstack/react-query';
import { searchHardMemories } from '@/services/memory/facets';
import type { FacetSel } from '../lib/facets';

export function useHardSearch(
  selections: FacetSel[],
  q: string,
  page: number,
  limit: number,
  sort: 'new'|'importance'
) {
  return useQuery({
    queryKey: ['hme-search', { selections, q, page, limit, sort }],
    queryFn: () => searchHardMemories({ selections, q, page, limit, sort }),
    keepPreviousData: true,
    staleTime: 10_000,
  });
}


