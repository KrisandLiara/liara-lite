import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagHighlightingProps {
  tags: string[];
  onTagClick: (tag: string, event: React.MouseEvent) => void;
  conversationId: string;
}

export const TagHighlighting: React.FC<TagHighlightingProps> = ({
  tags,
  onTagClick,
  conversationId
}) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <Badge
          key={`${conversationId}-${tag}-${index}`}
          variant="secondary"
          className={cn(
            "text-xs cursor-pointer transition-all duration-200 hover:scale-105",
            "bg-slate-800/60 border-slate-600/70 text-slate-300 hover:bg-slate-800/80"
          )}
          onClick={(e) => onTagClick(tag, e)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}; 