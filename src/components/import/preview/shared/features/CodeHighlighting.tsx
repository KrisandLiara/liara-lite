import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Code } from 'lucide-react';
import { safeRenderContent } from '../utils/contentFormatters';

interface CodeHighlightingProps {
  content: string;
}

export const CodeHighlighting: React.FC<CodeHighlightingProps> = ({ content }) => {
  if (!content) return null;
  
  const text = safeRenderContent(content);
  
  // Check if content contains code blocks
  if (!text.includes('```') && !text.includes('`')) return null;
  
  // Split content into parts based on code blocks
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  
  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Multi-line code block
          const code = part.slice(3, -3).trim();
          const language = code.split('\n')[0].trim();
          const codeContent = language ? code.slice(language.length).trim() : code;
          
          return (
            <div key={index} className="relative">
              <div className="absolute top-2 right-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-content-code-bg/60 border-content-code-border/70 text-content-code-light"
                >
                  <Code className="h-3 w-3 mr-1" />
                  {language || 'code'}
                </Badge>
              </div>
              <pre className="p-4 rounded-lg bg-content-code-bg/30 border border-content-code-border/50 text-content-code-light overflow-x-auto">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        } else if (part.startsWith('`') && part.endsWith('`')) {
          // Inline code
          return (
            <code key={index} className="px-1.5 py-0.5 rounded bg-content-code-bg/30 border border-content-code-border/50 text-content-code-light">
              {part.slice(1, -1)}
            </code>
          );
        }
        
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}; 