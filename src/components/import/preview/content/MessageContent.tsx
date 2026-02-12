import React from 'react';
import { cn } from '@/lib/utils';
import { Code, Mic, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MessageContentProps {
  content: string | { type: string; url: string; text?: string };
  isImage?: boolean;
  isVoice?: boolean;
  hasTranscript?: boolean;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  isImage,
  isVoice,
  hasTranscript
}) => {
  // Handle placeholder content first
  if (typeof content === 'string') {
    // Show Sound Data badge only for [Unknown Content]
    if (content === '[Unknown Content]') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="text-xs bg-[#78350f]/20 text-[#fbbf24] border-[#d97706]/50"
            >
              <Mic className="h-3 w-3 mr-1" />
              Sound Data
            </Badge>
          </div>
        </div>
      );
    }

    if (content.includes('[Image]')) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="text-xs bg-[#3730a3]/20 text-[#818cf8] border-[#4f46e5]/50"
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              Image
            </Badge>
          </div>
          <div className="p-4 rounded-lg border bg-[#3730a3]/10 border-[#4f46e5]/30 text-[#818cf8]/90">
            Image content - preview not available
          </div>
        </div>
      );
    }

    // Handle transcript text - remove [Transcript] tag and show transcript badge
    if (content.includes('[Transcript]')) {
      const cleanContent = content.replace('[Transcript]', '').trim();
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="text-xs bg-[#78350f]/30 border-[#d97706]/50 text-[#fbbf24]"
            >
              Transcript
            </Badge>
          </div>
          <div className="text-sm text-slate-300 whitespace-pre-wrap">
            {cleanContent}
          </div>
        </div>
      );
    }

    // If it's just regular text without any special tags, render it directly
    return (
      <div className="text-sm text-slate-300 whitespace-pre-wrap">
        {content}
      </div>
    );
  }

  // Handle different content types
  if (typeof content === 'object') {
    if (content.type === 'voice') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {content.text ? (
              <Badge 
                variant="secondary" 
                className="text-xs bg-[#78350f]/30 border-[#d97706]/50 text-[#fbbf24]"
              >
                Transcript
              </Badge>
            ) : (
              <Badge 
                variant="secondary" 
                className="text-xs bg-[#78350f]/20 text-[#fbbf24] border-[#d97706]/50"
              >
                <Mic className="h-3 w-3 mr-1" />
                Sound Data
              </Badge>
            )}
          </div>
          {content.text && (
            <div className="text-sm text-slate-300 whitespace-pre-wrap">
              {content.text}
            </div>
          )}
        </div>
      );
    }

    if (content.type === 'image') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="text-xs bg-[#3730a3]/60 border-[#4f46e5]/70 text-[#818cf8]"
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              Image
            </Badge>
          </div>
          <div className="relative w-full max-w-[300px] aspect-video bg-[#3730a3]/20 border border-[#4f46e5]/50 rounded-lg overflow-hidden">
            <img 
              src={content.url} 
              alt="Message attachment" 
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
          {content.text && (
            <div className="text-sm text-slate-300 whitespace-pre-wrap">
              {content.text}
            </div>
          )}
        </div>
      );
    }

    if (content.type === 'code') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="text-xs bg-[#6b21a8]/60 border-[#9333ea]/70 text-[#c084fc]"
            >
              <Code className="h-3 w-3 mr-1" />
              Code Block
            </Badge>
          </div>
          <pre className="p-4 bg-[#6b21a8]/30 border border-[#9333ea]/50 rounded-lg overflow-x-auto">
            <code className="text-sm text-[#c084fc]">{content.text}</code>
          </pre>
        </div>
      );
    }
  }

  // Default text content
  return (
    <div className="text-sm text-slate-300 whitespace-pre-wrap">
      {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
    </div>
  );
}; 