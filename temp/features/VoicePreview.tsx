import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mic } from 'lucide-react';
import { safeRenderContent } from '../utils/contentFormatters';
import { cn } from '@/lib/utils';

interface VoicePreviewProps {
  content: string;
  hasTranscript?: boolean;
}

export const VoicePreview: React.FC<VoicePreviewProps> = ({ content, hasTranscript = false }) => {
  if (!content) return null;
  
  const text = safeRenderContent(content);
  
  return (
    <div className="relative">
      <div className="absolute top-2 right-2">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-xs",
            hasTranscript
              ? "bg-content-voice-bg/60 border-content-voice-border/70 text-content-voice-light"
              : "bg-content-voice-bg/20 text-content-voice-light border-content-voice-border/50"
          )}
        >
          <Mic className="h-3 w-3 mr-1" />
          {hasTranscript ? 'Voice' : 'Missing Transcript'}
        </Badge>
      </div>
      <div className={cn(
        "p-4 rounded-lg border",
        hasTranscript
          ? "bg-content-voice-bg/30 border-content-voice-border/50 text-content-voice-light"
          : "bg-content-voice-bg/20 border-content-voice-border/30 text-content-voice-light"
      )}>
        {text}
      </div>
    </div>
  );
}; 