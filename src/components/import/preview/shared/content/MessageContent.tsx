import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Code, Mic, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ImagePreview } from '../features/ImagePreview';
import { findCodeBlocks, filterRenderableBlocks } from '@/lib/import/codeDetection';

interface MessageContentProps {
  content: string | { type: string; url: string; text?: string };
  isImage?: boolean;
  isVoice?: boolean;
  hasTranscript?: boolean;
  showRemovableCode?: boolean;
  author?: string;
  role?: string;
  highlightTags?: string[];
  tagColorMap?: Record<string, string>;
  highlightEntities?: Record<string, string[]>;
  entityColorMap?: Record<string, string>;
  flashTag?: string;
  flashEntity?: { category?: string; value: string };
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  isImage,
  isVoice,
  hasTranscript,
  showRemovableCode,
  author,
  role,
  highlightTags,
  tagColorMap,
  highlightEntities,
  entityColorMap,
  flashTag,
  flashEntity
}) => {
  const underlineClassForColor = (color: string) => {
    switch (color) {
      case 'emerald': return 'decoration-emerald-400/70';
      case 'sky': return 'decoration-sky-400/70';
      case 'violet': return 'decoration-violet-400/70';
      case 'amber': return 'decoration-amber-400/70';
      case 'indigo': return 'decoration-indigo-400/70';
      case 'rose': return 'decoration-rose-400/70';
      case 'lime': return 'decoration-lime-400/70';
      case 'cyan': return 'decoration-cyan-400/70';
      case 'fuchsia': return 'decoration-fuchsia-400/70';
      case 'yellow': return 'decoration-yellow-400/70';
      default: return 'decoration-slate-400/60';
    }
  };

  const highlightTextWithTags = (text: string) => {
    if (!highlightTags || highlightTags.length === 0) return text;
    const escaped = highlightTags
      .filter(Boolean)
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (escaped.length === 0) return text;
    const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => {
      const tag = (highlightTags || []).find(t => new RegExp(`^${t}$`, 'i').test(part));
      if (!tag) return <span key={i}>{part}</span>;
      const color = tagColorMap?.[tag] || 'emerald';
      const isFlash = Boolean(flashTag && new RegExp(`^${flashTag}$`, 'i').test(part));
      const cls = `underline underline-offset-2 ${underlineClassForColor(color)}${isFlash ? ' liara-inline-flash' : ''}`;
      return <span key={i} className={cls}>{part}</span>;
    });
  };

  const entityHighlightClass = (color?: string) => {
    switch (color) {
      case 'purple':
      case 'violet': return 'font-semibold text-violet-200 bg-violet-900/20 ring-1 ring-violet-600/30 px-0.5 rounded';
      case 'emerald': return 'font-semibold text-emerald-200 bg-emerald-900/20 ring-1 ring-emerald-600/30 px-0.5 rounded';
      case 'sky': return 'font-semibold text-sky-200 bg-sky-900/20 ring-1 ring-sky-600/30 px-0.5 rounded';
      case 'cyan': return 'font-semibold text-cyan-200 bg-cyan-900/20 ring-1 ring-cyan-600/30 px-0.5 rounded';
      case 'indigo': return 'font-semibold text-indigo-200 bg-indigo-900/20 ring-1 ring-indigo-600/30 px-0.5 rounded';
      case 'amber': return 'font-semibold text-amber-200 bg-amber-900/20 ring-1 ring-amber-600/30 px-0.5 rounded';
      case 'slate':
      default: return 'font-semibold text-slate-200 bg-slate-800/30 ring-1 ring-slate-500/30 px-0.5 rounded';
    }
  };

  const findTagColorForTerm = (term: string): string | undefined => {
    if (!highlightTags || !tagColorMap) return undefined;
    const hit = highlightTags.find(t => t.toLowerCase() === term.toLowerCase());
    return hit ? tagColorMap[hit] : undefined;
  };

  const entityTextColorClass = (color?: string) => {
    switch (color) {
      case 'violet': return 'text-violet-300';
      case 'emerald': return 'text-emerald-300';
      case 'sky': return 'text-sky-300';
      case 'cyan': return 'text-cyan-300';
      case 'indigo': return 'text-indigo-300';
      case 'amber': return 'text-amber-300';
      default: return 'text-slate-300';
    }
  };

  const applyEntities = (nodes: ReactNode[]): ReactNode[] => {
    if (!highlightEntities) return nodes;
    const categories = Object.keys(highlightEntities);
    let processed = nodes;
    for (const cat of categories) {
      const values = (highlightEntities[cat] || []).filter(Boolean);
      if (values.length === 0) continue;
      const escaped = values
        .filter(v => v && v.length > 2)
        .map(v => v
          // escape regex
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          // flexible whitespace
          .replace(/\s+/g, '\\s+')
          // tolerate curly quotes/apostrophes
          .replace(/['’‘]/g, "['’‘]")
          // tolerate hyphen/en-dash/em-dash
          .replace(/-/g, '[-–—]')
        );
      if (escaped.length === 0) continue;
      const regex = new RegExp(`(^|[^A-Za-z0-9_])(${escaped.join('|')})(?=$|[^A-Za-z0-9_])`, 'gi');
      const colorName = entityColorMap?.[cat] ||
        (cat === 'PERSON' ? 'violet' : cat === 'ORG' ? 'emerald' : cat === 'GPE' ? 'sky' : cat === 'DATE' ? 'cyan' : cat === 'PRODUCT' ? 'indigo' : cat === 'EVENT' ? 'amber' : 'slate');
      const baseCls = entityHighlightClass(colorName);
      processed = processed.flatMap((node, idx) => {
        if (typeof node !== 'string') return [node];
        const parts = node.split(regex);
        return parts.map((p, i) => {
          const isMatch = values.some(v => new RegExp(`^${v}$`, 'i').test(p));
          if (!isMatch) return <span key={`${idx}-${i}`}>{p}</span>;
          const tagColor = findTagColorForTerm(p);
          const underlineCls = tagColor ? ` underline underline-offset-2 ${underlineClassForColor(tagColor)}` : '';
          const textColor = entityTextColorClass(colorName);
          const displayCat = cat === 'GPE' ? 'LOC' : cat;
          const shouldFlashEntity = Boolean(
            flashEntity?.value &&
            new RegExp(`^${flashEntity.value}$`, 'i').test(p) &&
            (!flashEntity.category || String(flashEntity.category) === String(cat))
          );
          return (
            <span
              key={`${idx}-${i}`}
              className={`relative group ${baseCls + underlineCls}${shouldFlashEntity ? ' liara-inline-flash' : ''}`}
            >
              {p}
              <span className={`pointer-events-none absolute -top-3 right-0 text-[10px] opacity-0 group-hover:opacity-100 ${textColor}`}>
                {displayCat}
              </span>
            </span>
          );
        });
      });
    }
    return processed;
  };

  const applyTags = (nodes: ReactNode[]): ReactNode[] => {
    return nodes.flatMap((node, idx) => {
      if (typeof node !== 'string') return [node];
      const underlined = highlightTextWithTags(node);
      return Array.isArray(underlined)
        ? underlined.map((n, i) => <React.Fragment key={`${idx}-t-${i}`}>{n}</React.Fragment>)
        : [<span key={`${idx}-t`}>{underlined as ReactNode}</span>];
    });
  };

  const renderTextWithHighlights = (text: string) => {
    const base: ReactNode[] = [text];
    const withEntities = applyEntities(base);
    const withTags = applyTags(withEntities);
    return withTags;
  };
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

    // Handle all image content including JSON prompts
    if (content.includes('[Image]') || content.includes('[Image Generated:') || 
        (typeof content === 'string' && content.includes('"prompt":'))) {
      let metadata = {};
      
      // Try to parse JSON format first
      try {
        if (typeof content === 'string' && content.includes('"prompt":')) {
          const jsonContent = JSON.parse(content.trim());
          if (jsonContent.prompt) {
            metadata = {
              isGenerated: true,
              prompt: jsonContent.prompt,
              size: jsonContent.size,
              model: 'DALL-E' // Default to DALL-E if not specified
            };
          }
        }
      } catch (e) {
        // If JSON parsing fails, try regular image tag parsing
        if (content.includes('[Image Generated:')) {
          const match = content.match(/\[Image Generated: (.*?)(?:\s+\((.*?)\))?(?:\s+using\s+(.*?))?\]/);
          if (match) {
            metadata = {
              isGenerated: true,
              prompt: match[1],
              size: match[2],
              model: match[3]
            };
          }
        }
      }
      
      return <ImagePreview content={content} metadata={metadata} />;
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
            {renderTextWithHighlights(cleanContent)}
          </div>
        </div>
      );
    }

    // Check for code blocks that will be removed
    if (showRemovableCode) {
      const blocks = findCodeBlocks(content, true);
      const filteredBlocks = filterRenderableBlocks(content, blocks);
      if (filteredBlocks.length > 0) {
        // debug removed

        // Create a version of the content with placeholders
        let processedContent = content;
        const placeholders: Array<{ start: number; end: number; placeholder: string }> = [];

        // Generate placeholders for each block
        filteredBlocks.forEach(block => {
          const placeholder = block.type === 'block'
            ? `[${block.language?.toUpperCase() || 'Code'} Block]`
            : '[Inline Code]';
          placeholders.push({ start: block.start, end: block.end, placeholder });
        });

        // Replace blocks with placeholders from end to start
        placeholders.sort((a, b) => b.start - a.start).forEach(({ start, end, placeholder }) => {
          processedContent = 
            processedContent.slice(0, start) +
            placeholder +
            processedContent.slice(end);
        });

        return (
          <div className="space-y-4">
            {filteredBlocks.map((block, index) => {
              const placeholder = block.type === 'block'
                ? `[${block.language?.toUpperCase() || 'Code'} Block]`
                : '[Inline Code]';

              return (
                <div key={index} className="relative group">
                  {/* Context before */}
                  {block.contextBefore && (
                    <div className="text-slate-300/60 mb-2">{block.contextBefore}</div>
                  )}

                   <div className={cn(
                    "my-2 p-4 rounded-lg overflow-x-auto transition-colors scroll-mt-12",
                    author === 'user' || role === 'user'
                      ? "bg-blue-950/20 border border-blue-500/40 group-hover:bg-blue-950/30"
                      : "bg-cyan-950/20 border border-cyan-500/40 group-hover:bg-cyan-950/30"
                  )}>
                    <pre className={cn(
                      "text-sm whitespace-pre-wrap",
                      author === 'user' || role === 'user' ? "text-blue-300" : "text-cyan-300"
                    )}>{block.content}</pre>
                  </div>

                  {/* Context after */}
                  {block.contextAfter && (
                    <div className="text-slate-300/60 mt-2">{block.contextAfter}</div>
                  )}

                  {/* Placeholder badge */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        "bg-emerald-900/50 border-emerald-500/50 text-emerald-200"
                      )}
                    >
                      <Code className="h-3 w-3 mr-1" />
                      {placeholder}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    }

    // If removal already happened and only placeholders remain, still show a green badge for visibility
    if (showRemovableCode) {
      const hasPlaceholder = /\[(?:Inline Code|[A-Z]+\s+Block|Code Block)\]/i.test(content);
      if (hasPlaceholder) {
        // Render placeholders with emerald inline highlight styling for visual context
        const parts = content.split(/(\[(?:Inline Code|[A-Z]+\s+Block|Code Block)\])/gi);
        return (
          <div className="relative">
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className={cn("text-xs bg-emerald-900/50 border-emerald-500/50 text-emerald-200")}
              >
                <Code className="h-3 w-3 mr-1" />
                Code Removed
              </Badge>
            </div>
            <div className="text-sm text-slate-300 whitespace-pre-wrap">
              {parts.map((p, i) =>
                p.match(/^\[(?:Inline Code|[A-Z]+\s+Block|Code Block)\]$/i)
                  ? (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded border bg-emerald-900/30 border-emerald-500/40 text-emerald-200"
                      >
                        {p}
                      </span>
                    )
                  : (
                      <span key={i}>{p}</span>
                    )
              )}
            </div>
          </div>
        );
      }
    }

    // If it's just regular text without any special tags, render it directly
    return (
      <div className="text-sm text-slate-300 whitespace-pre-wrap">
        {renderTextWithHighlights(content as string)}
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