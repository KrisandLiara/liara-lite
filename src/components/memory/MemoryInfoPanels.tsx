import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useMemoryContext } from '@/contexts/MemoryContext';
import { MemoryEntry } from '@/lib/memory/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatisticsOverviewPanel } from './StatisticsOverviewPanel';
import { FacetTagCloudPanel } from './FacetTagCloudPanel';

export const MemoryInfoPanels: React.FC = () => {
  const {
    recentMemories,
    setSelectedMemory,
  } = useMemoryContext();

  const onMemoryClick = (memory: MemoryEntry) => {
    setSelectedMemory(memory);
  };

  const displayRecentMemories = recentMemories.slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <Card className="flex flex-col h-full bg-slate-800/75 border-slate-700/50 backdrop-blur-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-sky-400">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow pt-2">
          {displayRecentMemories.length > 0 ? (
            <ScrollArea className="h-[120px]">
              <div className="space-y-2 pr-3">
                {displayRecentMemories.map(memory => (
                  <div
                    key={memory.id}
                    className="text-sm p-2 rounded-md hover:bg-slate-700/70 cursor-pointer border border-slate-600/50 transition-colors"
                    onClick={() => onMemoryClick(memory)}
                  >
                    <div className="font-medium truncate text-slate-200">{memory.metadata?.topic || 'Untitled Memory'}</div>
                    <div className="text-xs text-slate-400 line-clamp-2">
                      {memory.summary || memory.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No recent memories</p>
          )}
        </CardContent>
      </Card>

      <FacetTagCloudPanel />

      <StatisticsOverviewPanel />
    </div>
  );
};
