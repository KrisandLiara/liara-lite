import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Image } from 'lucide-react';
import { safeRenderContent } from '../utils/contentFormatters';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
  content: string;
  metadata?: {
    prompt?: string;
    model?: string;
    size?: string;
    isGenerated?: boolean;
    description?: string;
  };
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ content, metadata }) => {
  if (!content) return null;
  
  // Clean up content text by removing [Image] tags
  const cleanContent = (text: string) => {
    return text
      .replace(/\[Image\]/g, '')
      .replace(/\[Image Generated:/g, '')
      .replace(/\]/g, '')
      .trim();
  };
  
  const text = cleanContent(safeRenderContent(content));
  const isGenerated = metadata?.isGenerated || content.includes('Image Generated:');
  
  return (
    <div className="relative space-y-2">
      <div className="flex items-center justify-between">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-xs",
            isGenerated
              ? "bg-indigo-900/40 border-indigo-600/50 text-indigo-200"
              : "bg-indigo-900/30 border-indigo-600/40 text-indigo-300"
          )}
        >
          <Image className="h-3 w-3 mr-1" />
          {isGenerated ? 'AI Generated Image' : 'Image'}
        </Badge>
        
        {metadata?.size && (
          <span className="text-xs text-indigo-300/70">
            {metadata.size}
          </span>
        )}
      </div>
      
      <div className={cn(
        "p-4 rounded-lg border space-y-2",
        isGenerated
          ? "bg-indigo-900/30 border-indigo-600/40"
          : "bg-indigo-900/20 border-indigo-600/30"
      )}>
        {isGenerated ? (
          <div className="space-y-2">
            <div className="text-sm text-indigo-200/90 space-y-1">
              {metadata?.prompt && (
                <div className="flex gap-2">
                  <span className="text-indigo-300/70 whitespace-nowrap">Prompt:</span>
                  <span>{metadata.prompt}</span>
                </div>
              )}
              {metadata?.model && (
                <div className="flex gap-2">
                  <span className="text-indigo-300/70 whitespace-nowrap">Model:</span>
                  <span>{metadata.model}</span>
                </div>
              )}
            </div>
          </div>
        ) : metadata?.description ? (
          <div className="text-sm text-indigo-200/90">
            {metadata.description}
          </div>
        ) : text ? (
          <div className="text-sm text-indigo-200/90">
            {text}
          </div>
        ) : null}
      </div>
    </div>
  );
}; 