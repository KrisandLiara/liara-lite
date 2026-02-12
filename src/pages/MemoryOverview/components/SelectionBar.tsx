import React from 'react';
import type { FacetSel } from '../lib/facets';

type Props = {
  selections: FacetSel[];
  onRemove: (idx: number) => void;
  onClear: () => void;
};

export const SelectionBar: React.FC<Props> = ({ selections, onRemove, onClear }) => {
  if (selections.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-2 flex items-center gap-2 flex-wrap">
      {selections.map((s, idx) => (
        <button key={idx}
          className="text-xs rounded-full px-2 py-1 bg-slate-700/60 hover:bg-slate-600"
          title={`${s.op}`}
          onClick={() => onRemove(idx)}
        >
          {s.op === 'EXCLUDE' ? 'NOT ' : ''}{s.bucket}: {s.value}
        </button>
      ))}
      <div className="flex-1" />
      <button className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600" onClick={onClear}>Clear</button>
    </div>
  );
};


