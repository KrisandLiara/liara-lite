import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Image } from 'lucide-react';
import { safeRenderContent } from '../utils/contentFormatters';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
  content: string;
  isGenerated?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ content, isGenerated = false }) => {
  if (!content) return null;
  
  const text = safeRenderContent(content);
  
  return (
    <div className="relative">
      <div className="absolute top-2 right-2">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-xs",
            isGenerated
              ? "bg-content-image-bg/60 border-content-image-border/70 text-content-image-light"
              : "bg-content-image-bg/20 text-content-image-light border-content-image-border/50"
          )}
        >
          <Image className="h-3 w-3 mr-1" />
          {isGenerated ? 'Generated Image' : 'Image'}
        </Badge>
      </div>
      <div className={cn(
        "p-4 rounded-lg border",
        isGenerated
          ? "bg-content-image-bg/30 border-content-image-border/50 text-content-image-light"
          : "bg-content-image-bg/20 border-content-image-border/30 text-content-image-light"
      )}>
        {text}
      </div>
    </div>
  );
}; 