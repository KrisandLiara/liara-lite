import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFacets, refreshFacets } from '@/services/memory/facets';
import type { FacetSel, FacetBucket } from '../lib/facets';

type Props = {
  selections: FacetSel[];
  onAdd: (bucket: FacetBucket, value: string, op?: 'INCLUDE'|'EXCLUDE') => void;
};

const BUCKET_ORDER: FacetBucket[] = [
  'keyword',
  'entity.person',
  'entity.org',
  'entity.product',
  'entity.location',
  'entity.event',
  'entity.date_bucket',
  'entity.misc',
];

export const FacetSidebar: React.FC<Props> = ({ selections, onAdd }) => {
  const [filter, setFilter] = React.useState('');
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['hme-facets'],
    queryFn: () => getFacets({ source: 'hard', limit: 40 }),
    staleTime: 30_000,
  });

  const onRefresh = async () => {
    await refreshFacets('hard');
    await refetch();
  };

  const byBucket = new Map<string, { value: string; freq: number }[]>();
  (data?.facets || []).forEach(g => byBucket.set(g.bucket, g.top));

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-3 text-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold text-slate-100">Facets</div>
        <button className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600" onClick={onRefresh} disabled={isFetching}>
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {isLoading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="text-red-400 text-sm">Failed to load facets</div>
      ) : (
        <div className="space-y-3">
          <input
            value={filter}
            onChange={(e)=>setFilter(e.target.value)}
            placeholder="Filter values…"
            className="w-full text-xs bg-slate-900/60 border border-slate-700 rounded px-2 py-1 mb-2"
          />
          {BUCKET_ORDER.map(bucket => {
            const items = byBucket.get(bucket) || [];
            if (items.length === 0) return null;
            const filtered = filter ? items.filter(({ value }) => value.toLowerCase().includes(filter.toLowerCase())) : items;
            const visible = filtered.slice(0, 12);
            const more = Math.max(0, filtered.length - visible.length);
            return (
              <div key={bucket}>
                <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">{bucket}</div>
                <div className="flex flex-wrap gap-2">
                  {visible.map(({ value, freq }) => (
                    <button
                      key={bucket + value}
                      className="text-xs rounded-full px-2 py-1 bg-slate-700/60 hover:bg-slate-600"
                      title={`${freq}`}
                      onClick={(e) => onAdd(bucket as FacetBucket, value, e.shiftKey ? 'EXCLUDE' : 'INCLUDE')}
                    >
                      {value} <span className="text-slate-400">({freq})</span>
                    </button>
                  ))}
                  {more > 0 && (
                    <span className="text-xs text-slate-400">+{more} more…</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


