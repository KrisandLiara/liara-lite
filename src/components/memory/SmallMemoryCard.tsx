import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MemoryEntry } from '@/lib/memory/types';
import { cn } from '@/lib/utils';

interface SmallMemoryCardProps {
  memory: MemoryEntry;
  onClick: () => void;
  onTagClick: (tag: string) => void;
}

export const SmallMemoryCard: React.FC<SmallMemoryCardProps> = ({ memory, onClick, onTagClick }) => {
  const displayContent = memory.summary || memory.content || '';

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm hover:border-sky-500/70 transition-all duration-150 ease-in-out flex flex-col h-full group",
      )}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-sm text-slate-200 font-medium line-clamp-1 group-hover:text-sky-400">
            {memory.topic || "Memory Entry"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-grow">
        <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed">
          {displayContent}
        </p>
      </CardContent>
      <CardFooter className="p-3 flex flex-wrap gap-1 items-end border-t border-slate-700/30">
        <div className="flex-grow flex flex-wrap gap-1">
          {Array.isArray(memory.tags) && memory.tags.slice(0, 3).map(tag => (
            <Badge 
              key={tag} 
              variant="secondary" 
              onClick={(e) => { e.stopPropagation(); onTagClick(tag); }} 
              className="text-xs bg-slate-700/80 text-sky-300/90 px-1.5 py-0.5 cursor-pointer hover:bg-slate-700 hover:text-sky-200"
            >
              #{tag}
            </Badge>
          ))}
          {memory.tags && memory.tags.length > 3 && (
              <Badge variant="outline" className="text-xs bg-slate-700/50 border-slate-600/70 text-slate-400 px-1 py-0.5">
                  +{memory.tags.length - 3}
              </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
            {memory.match_type?.includes('tag') && <Badge variant="outline" className="text-xs border-sky-600/80 bg-sky-900/40 text-sky-300">Tag</Badge>}
            {memory.match_type?.includes('hard') && <Badge variant="outline" className="text-xs border-teal-600/80 bg-teal-900/40 text-teal-300">Keyword</Badge>}
            {memory.match_type?.includes('semantic') && <Badge variant="outline" className="text-xs border-purple-600/80 bg-purple-900/40 text-purple-300">Semantic</Badge>}
        </div>
      </CardFooter>
    </Card>
  );
}; 
