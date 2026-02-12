import React, { useState } from 'react';

type Log = { t: number; level: 'info'|'error'|'warn'|'success'; msg: string };

export const LiveConsole: React.FC<{ logs: Log[]; onClear: () => void }>
  = ({ logs, onClear }) => {
  const [expanded, setExpanded] = useState(false);
  const last = logs[logs.length - 1];

  const levelColor = (lvl: string) =>
    lvl === 'error' ? 'text-red-400' : lvl === 'warn' ? 'text-yellow-400' : lvl === 'success' ? 'text-emerald-400' : 'text-sky-400';

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/40">
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <div className="text-xs text-slate-400">Live Console</div>
        <div className="flex items-center gap-2">
          <button className="text-xs text-slate-400 hover:text-slate-200" onClick={()=>setExpanded(e=>!e)}>
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button className="text-xs text-slate-400 hover:text-red-300" onClick={onClear}>Clear</button>
        </div>
      </div>
      {!expanded ? (
        <div className="px-3 pb-2 text-[11px] text-slate-300 truncate">
          {last ? (
            <>
              <span className="text-slate-500 mr-2">{new Date(last.t).toLocaleTimeString()}</span>
              <span className={`${levelColor(last.level)} font-semibold mr-1`}>{last.level.toUpperCase()}:</span>
              <span>{last.msg}</span>
            </>
          ) : (
            <span className="text-slate-500">No activity yet.</span>
          )}
        </div>
      ) : (
        <div className="max-h-40 overflow-auto px-3 pb-2 space-y-1">
          {logs.length === 0 && <div className="text-[11px] text-slate-500">No activity yet.</div>}
          {logs.map((l, idx)=> (
            <div key={idx} className="text-[11px] font-mono">
              <span className="text-slate-500 mr-2">{new Date(l.t).toLocaleTimeString()}</span>
              <span className={`${levelColor(l.level)} font-bold`}>{l.level.toUpperCase()}:</span>
              <span className="text-slate-300 ml-1">{l.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


