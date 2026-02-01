import React from 'react';
import { useMemory } from '@/contexts/MemoryContext';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TagCloudViewProps {
  onTagClick: (tag: string) => void;
}

export const TagCloudView: React.FC<TagCloudViewProps> = ({ onTagClick }) => {
  const { tags, isLoading } = useMemory();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <Card className="bg-slate-800/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-sky-300">Tag Cloud</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-slate-400">
          No tags yet
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...tags.map(t => t.count || 0), 0);
  const getFontSize = (count: number) => {
    if (maxCount <= 0) return '1em';
    // Log scaling reads better than linear when one tag dominates.
    const f = Math.log(1 + Math.max(0, count));
    const norm = Math.min(1, f / Math.log(1 + Math.max(1, maxCount)));
    const minSize = 0.9; // em
    const maxSize = 2.4; // em
    return `${minSize + (maxSize - minSize) * norm}em`;
  };

  return (
    <Card className="bg-slate-800/40 border-slate-700/50">
        <CardHeader>
            <CardTitle className="text-sky-300">Tag Cloud</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-center gap-x-4 gap-y-6 p-6 text-center">
        {tags.map(({ name, count }) => (
            <span
            key={name}
            className="cursor-pointer font-bold text-slate-300 hover:text-sky-400 transition-colors duration-200"
            style={{ fontSize: getFontSize(count || 0) }}
            title={`${count || 0} memories`}
            onClick={() => onTagClick(name)}
            >
            {name}
            </span>
        ))}
        </CardContent>
    </Card>
  );
}; 