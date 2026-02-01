import React from 'react';
import type { FacetBucket } from '../../MemoryOverview/lib/facets';

type Props = {
  items: any[];
  onChip?: (bucket: FacetBucket, value: string, e: React.MouseEvent) => void;
};

export const MemoryResults: React.FC<Props> = ({ items, onChip }) => {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-6 text-slate-300">
        No results yet. Add selections or type a query.
      </div>
    );
  }
  const Chip = ({ label, bucket }: { label: string; bucket: FacetBucket }) => (
    <button
      className="text-[11px] rounded-full px-2 py-0.5 bg-slate-700/60 hover:bg-slate-600"
      onClick={(e)=>onChip?.(bucket, label, e)}
      title={bucket}
    >
      {label}
    </button>
  );
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.id} className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-4">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="text-slate-100 font-medium truncate">{it.topic || 'Memory'}</div>
            <div className="text-xs text-slate-500 whitespace-nowrap">{new Date(it.created_at).toLocaleString()}</div>
          </div>
          <div className="text-slate-300 text-sm line-clamp-2">{it.summary || it.fact || it.content}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(it.keywords || it.tags || []).slice(0,5).map((k: string)=> (
              <Chip key={'k'+k} label={k} bucket={'keyword' as FacetBucket} />
            ))}
            {Array.isArray(it.named_entities?.PERSON) && it.named_entities.PERSON.slice(0,3).map((p: string)=>(
              <Chip key={'p'+p} label={p} bucket={'entity.person' as FacetBucket} />
            ))}
            {Array.isArray(it.named_entities?.ORG) && it.named_entities.ORG.slice(0,3).map((o: string)=>(
              <Chip key={'o'+o} label={o} bucket={'entity.org' as FacetBucket} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
