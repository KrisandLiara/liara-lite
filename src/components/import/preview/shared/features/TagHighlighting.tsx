import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Code, ImageIcon, Mic } from 'lucide-react';

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

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case 'code':
        return {
          className: 'bg-purple-900/60 border-purple-600/70 text-purple-300 hover:bg-purple-900/80',
          icon: <Code className="h-3 w-3 mr-1" />
        };
      case 'image':
      case 'image_context':
        return {
          className: 'bg-emerald-900/60 border-emerald-600/70 text-emerald-300 hover:bg-emerald-900/80',
          icon: <ImageIcon className="h-3 w-3 mr-1" />
        };
      case 'voice':
        return {
          className: 'bg-amber-900/60 border-amber-600/70 text-amber-300 hover:bg-amber-900/80',
          icon: <Mic className="h-3 w-3 mr-1" />
        };
      default:
        return {
          className: 'bg-sky-900/60 border-sky-600/70 text-sky-300 hover:bg-sky-900/80',
          icon: null
        };
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => {
        const { className, icon } = getTagStyle(tag);
        return (
          <Badge
            key={`${conversationId}-${tag}-${index}`}
            variant="outline"
            className={cn(
              "text-xs cursor-pointer transition-all duration-200 hover:scale-105",
              className
            )}
            onClick={(e) => onTagClick(tag, e)}
          >
            {icon}
            {tag}
          </Badge>
        );
      })}
    </div>
  );
};