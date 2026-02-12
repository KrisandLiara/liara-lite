import apiClient from '@/services/api';
import { supabase } from '@/integrations/supabase/client';

export type FacetTop = { value: string; freq: number };
export type FacetGroup = { bucket: string; top: FacetTop[] };
export type FacetsResponse = { facets: FacetGroup[] };

export async function getFacets(options: { test?: boolean; buckets?: string[]; limit?: number; source?: 'hard'|'sem'; selections?: Array<{ bucket: string; value: string; op: 'INCLUDE'|'EXCLUDE' }> } = {}): Promise<FacetsResponse & { source: 'hard'|'sem' }> {
  const { test = true, buckets, limit = 20, source = 'sem', selections } = options;
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const params: Record<string, any> = { test, limit, source };
  if (buckets && buckets.length > 0) params.buckets = buckets.join(',');
  if (selections) params.selections = JSON.stringify(selections);

  const { data } = await apiClient.get<FacetsResponse & { source: 'hard'|'sem' }>('/memories/facets', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

export async function refreshFacets(source: 'hard'|'sem' = 'hard'): Promise<{ ok: true }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const { data } = await apiClient.post<{ ok: true }>('/memories/admin/refresh-facets', { source }, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

export type TagOverview = {
  summary: { total: number; firstSeenISO: string | null; lastSeenISO: string | null };
  cofacets: Record<string, Array<{ value: string; freq: number }>>;
  timeline: Array<{ ym: string; freq: number }>;
  sources: Array<{ source: string; freq: number }>;
  examples: Array<{ id: string; fact?: string; topic?: string; created_at: string }>;
};

export async function getTagOverview(params: {
  source?: 'hard'|'sem';
  test?: boolean;
  bucket: string;
  value: string;
  selections?: Array<{ bucket: string; value: string; op: 'INCLUDE'|'EXCLUDE' }>;
}): Promise<TagOverview> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const { data } = await apiClient.get<TagOverview>('/memories/tag/overview', {
    params: {
      source: params.source || 'hard',
      test: params.test ?? true,
      bucket: params.bucket,
      value: params.value,
      selections: JSON.stringify(params.selections || []),
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

export async function searchHardMemories(params: {
  selections?: Array<{ bucket: string; value: string; op: 'INCLUDE'|'EXCLUDE' }>,
  q?: string,
  page?: number,
  limit?: number,
  sort?: 'new'|'importance',
}): Promise<{ source: 'hard', page: number, limit: number, total: number, items: any[] }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const { data } = await apiClient.get('/memories/search', {
    params: {
      source: 'hard',
      selections: JSON.stringify(params.selections || []),
      q: params.q || '',
      page: params.page || 1,
      limit: params.limit || 20,
      sort: params.sort || 'new',
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}


