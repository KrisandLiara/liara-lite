export type FacetBucket =
  | 'keyword'
  | 'entity.person'
  | 'entity.org'
  | 'entity.product'
  | 'entity.location'
  | 'entity.date'
  | 'entity.event'
  | 'entity.misc'
  | 'entity.date_bucket';

export type FacetSel = { bucket: FacetBucket; value: string; op: 'INCLUDE' | 'EXCLUDE' };

export const ALL_BUCKETS: FacetBucket[] = [
  'keyword',
  'entity.person',
  'entity.org',
  'entity.product',
  'entity.location',
  'entity.event',
  'entity.date',
  'entity.misc',
  'entity.date_bucket',
];

export const FACET_COLORS: Record<FacetBucket, string> = {
  keyword: '#9aa4ff',
  'entity.person': '#a78bfa',
  'entity.org': '#34d399',
  'entity.product': '#818cf8',
  'entity.location': '#60a5fa',
  'entity.date': '#22d3ee',
  'entity.event': '#f59e0b',
  'entity.misc': '#94a3b8',
  'entity.date_bucket': '#22d3ee',
};


