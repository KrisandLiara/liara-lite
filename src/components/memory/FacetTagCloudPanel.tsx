import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFacets } from '@/services/memory/facets';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type Props = { source?: 'hard'|'sem'; onSelect?: (label: string, e: React.MouseEvent) => void };

function scaleFont(freq: number, min = 12, max = 36) {
  const f = Math.log(1 + Math.max(0, freq));
  const norm = Math.min(1, f / Math.log(1 + 100));
  return Math.round(min + (max - min) * norm);
}

export const FacetTagCloudPanel: React.FC<Props> = ({ source = 'sem', onSelect }) => {
  const { isTestMode } = useSettings();
  const { data, isLoading, error } = useQuery({
    queryKey: ['facets', { test: isTestMode, buckets: ['keyword'], source }],
    queryFn: () => getFacets({ test: isTestMode, buckets: ['keyword'], limit: 100, source }),
    staleTime: 30_000,
  });

  const keywords = data?.facets.find(f => f.bucket === 'keyword')?.top || [];

  return (
    <Card className="bg-slate-800/40 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-sky-300">Tag Cloud (Keywords)</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[160px] flex items-center justify-center p-4">
        {isLoading ? (
          <div className="text-slate-400 text-sm">Loading…</div>
        ) : error ? (
          <div className="text-red-400 text-sm">Failed to load facets</div>
        ) : keywords.length === 0 ? (
          <div className="text-slate-400 text-sm">No keywords yet</div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
            {keywords.map(({ value, freq }) => (
              <span
                key={value}
                className="cursor-pointer font-semibold text-slate-300 hover:text-sky-300 transition-colors"
                style={{ fontSize: `${scaleFont(freq)}px` }}
                title={`${freq} memories`}
                onClick={(e)=> onSelect?.(value, e)}
              >
                {value}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


