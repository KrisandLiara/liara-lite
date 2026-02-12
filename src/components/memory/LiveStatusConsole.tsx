import React, { useRef, useEffect } from 'react';

export type LogEntry = {
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
};

interface LiveStatusConsoleProps {
  log?: LogEntry[];
  stage?: 'idle' | 'processing' | 'enriching' | 'loading';
  progress?: number; // 0-100
  isStreaming?: boolean;
  summaryText?: string;
}

const LiveStatusConsole = ({ log, stage = 'idle', progress, isStreaming, summaryText }: LiveStatusConsoleProps) => {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = 0;
    }
  }, [log]);

  return (
    <div className="bg-slate-900/70 text-white font-mono text-sm rounded-lg border border-slate-700/50 overflow-hidden">
      {/* Header with stage & mini stats */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-700/50 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            stage === 'enriching' ? 'bg-emerald-400 animate-pulse' :
            stage === 'processing' ? 'bg-cyan-400 animate-pulse' :
            stage === 'loading' ? 'bg-blue-400 animate-pulse' :
            'bg-slate-400'
          }`} />
          <span className="text-slate-200">
            {stage === 'enriching' ? 'Enriching' : stage === 'processing' ? 'Processing' : stage === 'loading' ? 'Loading' : 'Idle'}
          </span>
          {summaryText && <span className="text-slate-400 ml-2">{summaryText}</span>}
        </div>
        {log && (
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
            <span>{log.length} msgs</span>
            <span className="text-green-400">{log.filter(l=>l.type==='success').length} ok</span>
            <span className="text-yellow-300">{log.filter(l=>l.type==='warning').length} warn</span>
            <span className="text-red-400">{log.filter(l=>l.type==='error').length} err</span>
          </div>
        )}
      </div>

      {(isStreaming || typeof progress === 'number') && (
        <div className="px-4 pt-2">
          <div className="h-1.5 bg-slate-800/80 rounded overflow-hidden">
            {typeof progress === 'number' ? (
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
            ) : (
              <div className="h-full w-1/3 bg-emerald-500 animate-pulse" />
            )}
          </div>
        </div>
      )}

      <div 
        ref={consoleRef}
        className="p-4 h-64 overflow-y-auto flex flex-col-reverse"
      >
        <div className="flex flex-col">
        {log && log.map((logEntry, index) => (
          <div key={index} className="flex items-start">
            <span className="text-slate-500 mr-2">{logEntry.timestamp}</span>
            <span className={`flex-1 ${
              logEntry.type === 'error' ? 'text-red-400' : 
              logEntry.type === 'warning' ? 'text-yellow-400' : 
              logEntry.type === 'success' ? 'text-green-400' : 'text-slate-300'
            }`}>
              {logEntry.message}
            </span>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default LiveStatusConsole;
