import React, { useEffect, useRef } from 'react';
import type { FacetSel, FacetBucket } from '../lib/facets';
import { getTagOverview } from '@/services/memory/facets';
import { useQuery } from '@tanstack/react-query';

type Props = {
  open: boolean;
  onClose: () => void;
  bucket: FacetBucket | null;
  value: string | null;
  selections: FacetSel[];
  onAdd: (bucket: FacetBucket, value: string, op?: 'INCLUDE'|'EXCLUDE') => void;
};

export const TagInspectorDrawer: React.FC<Props> = ({ open, onClose, bucket, value, selections, onAdd }) => {
  const enabled = open && !!bucket && !!value;
  const { data, isLoading, error } = useQuery({
    queryKey: ['tag-overview', { bucket, value, selections }],
    queryFn: () => getTagOverview({ bucket: bucket!, value: value!, selections }),
    enabled,
    staleTime: 30_000,
  });

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) onClose();
    };
    if (open) {
      document.addEventListener('keydown', onEsc);
      document.addEventListener('mousedown', onDown, true);
    }
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('mousedown', onDown, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 flex items-start justify-center pt-12">
        <div ref={panelRef} className="pointer-events-auto w-[98%] md:w-[94%] max-h-[76%] overflow-y-auto rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl shadow-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-slate-300">Inspector</div>
            <button onClick={onClose} className="text-slate-300 hover:text-white text-sm">Close</button>
          </div>
          <div className="mb-2 text-slate-100 font-semibold">{bucket}: {value}</div>
          {isLoading ? (
            <div className="text-slate-300 text-sm">Loading…</div>
          ) : error ? (
            <div className="text-red-400 text-sm">Failed to load overview</div>
          ) : data ? (
            <div className="space-y-4">
              <div className="text-xs text-slate-300">Total: {data.summary.total} • First: {data.summary.firstSeenISO ? new Date(data.summary.firstSeenISO).toLocaleDateString() : '—'} • Last: {data.summary.lastSeenISO ? new Date(data.summary.lastSeenISO).toLocaleDateString() : '—'}</div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-300 mb-1">Top co-facets</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(data.cofacets).map(([b, items]) => (
                    items && items.length > 0 ? (
                      <div key={b}>
                        <div className="text-[11px] text-slate-200 mb-1">{b}</div>
                        <div className="flex flex-wrap gap-2">
                          {items.map(({ value: v, freq }) => (
                            <button key={b+v} className="text-[11px] rounded-full px-2 py-0.5 bg-white/10 border border-white/10 hover:bg-white/20" onClick={()=>onAdd(b as FacetBucket, v, 'INCLUDE')} title={`${freq}`}>
                              <span className="text-slate-100">{v}</span> <span className="text-slate-300">({freq})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-300 mb-1">Timeline</div>
                <div className="flex flex-wrap gap-1 text-[11px] text-slate-100">
                  {data.timeline.map(p => (
                    <span key={p.ym} className="px-1 py-0.5 rounded bg-white/10 border border-white/10">{p.ym} {p.freq}</span>
                  ))}
                  {data.timeline.length === 0 && <div className="text-slate-300">No data</div>}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-300 mb-1">Examples</div>
                <div className="space-y-2">
                  {data.examples.map(ex => (
                    <div key={ex.id} className="rounded border border-white/10 bg-white/5 p-2">
                      <div className="text-[11px] text-slate-300 mb-1">{new Date(ex.created_at).toLocaleString()}</div>
                      <div className="text-sm text-slate-100">{ex.topic || 'Memory'}</div>
                      <div className="text-xs text-slate-200 line-clamp-3">{ex.fact}</div>
                    </div>
                  ))}
                  {data.examples.length === 0 && <div className="text-slate-300 text-sm">No examples</div>}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};


