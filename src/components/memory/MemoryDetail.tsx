import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MemoryEntry } from '@/lib/memory/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pin, Link, Bot, BrainCircuit, ChevronDown, ChevronUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MemoryDetailProps {
  memory: MemoryEntry;
  onClose: () => void;
  onUpdate: (memory: MemoryEntry) => void;
  onDelete: (id: string) => void;
  searchQuery?: string;
}

const formatDate = (date: string) => new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const Highlight = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight || !text) return <>{text}</>;
  // Escape special characters in the highlight string for the regex
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-teal-700/50 text-teal-200 px-0.5 rounded-sm">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const DetailSection = ({ title, children }: { title: React.ReactNode, children: React.ReactNode }) => (
  <div>
    <h3 className="mb-2 text-sm font-semibold text-sky-300/80 tracking-wider uppercase flex items-center gap-2">{title}</h3>
    <div className="text-slate-300">{children}</div>
  </div>
);

const getImportanceClass = (importance: number) => {
  if (importance > 3) return 'bg-sky-700/70 border-sky-600/80 text-sky-200';
  if (importance > 2) return 'bg-slate-600/70 border-slate-500/80 text-slate-200';
  return 'bg-slate-700/60 border-slate-600/80 text-slate-300';
};

const getSentimentClass = (sentiment?: string) => {
    switch (sentiment) {
        case 'positive': return 'bg-green-700/60 border-green-600/80 text-green-200';
        case 'negative': return 'bg-red-700/60 border-red-600/80 text-red-200';
        default: return 'bg-slate-600/70 border-slate-500/80 text-slate-200';
    }
}

export const MemoryDetail: React.FC<MemoryDetailProps> = ({ memory, onClose, onUpdate, onDelete, searchQuery }) => {
  const [showRawMetadata, setShowRawMetadata] = useState(false);
  const canReconstruct = memory.conversation_title && memory.conversation_start_time;

  const hasMatchType = (type: 'tag' | 'hard' | 'semantic') => memory.match_type?.includes(type);

  // Highlighting should only happen for 'hard' (keyword) matches where a search query was used.
  const shouldHighlight = hasMatchType('hard') && searchQuery;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-800/90 border-slate-700/60 backdrop-blur-md text-slate-200 shadow-2xl p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-grow">
                <DialogTitle className="text-sky-400 text-xl font-bold flex items-center gap-2">
                    {memory.topic || "Memory Details"}
                    {memory.pinned && <Pin className="h-4 w-4 text-sky-400/80" />}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                    Created: {formatDate(memory.created_at)}
                </DialogDescription>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
                {memory.tags?.map(tag => <Badge key={tag} variant="secondary" className="bg-slate-700/80 text-sky-300/90">{tag}</Badge>)}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
            <div className='p-6 pt-0 space-y-6'>
                {memory.summary && <DetailSection title="Summary"><p className="text-base italic leading-relaxed">{shouldHighlight ? <Highlight text={memory.summary} highlight={searchQuery!} /> : memory.summary}</p></DetailSection>}
                <DetailSection title={
                    <>
                        Content
                        {memory.role === 'user' && (
                            <span className="text-xs text-slate-400 font-normal normal-case flex items-center gap-1">
                                (<User className="h-3 w-3" /> User)
                            </span>
                        )}
                        {memory.role === 'assistant' && (
                            <span className="text-xs text-slate-400 font-normal normal-case flex items-center gap-1">
                                (<Bot className="h-3 w-3" /> AI)
                            </span>
                        )}
                    </>
                }>
                    <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-md">
                        <p className="whitespace-pre-wrap text-base text-slate-100 leading-relaxed">{shouldHighlight ? <Highlight text={memory.content} highlight={searchQuery!} /> : memory.content}</p>
                    </div>
                </DetailSection>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700/50">
                    {/* Left side metadata */}
                    <div className="space-y-6">
                        <DetailSection title="Context">
                            <div className="flex flex-wrap gap-2">
                                {hasMatchType('tag') && <Badge className="border-sky-600/80 bg-sky-700/50 text-sky-200">Tag Match</Badge>}
                                {hasMatchType('hard') && <Badge className="border-teal-600/80 bg-teal-700/50 text-teal-200">Keyword Match</Badge>}
                                {memory.source_type && <Badge className="border-slate-600/80 bg-slate-700/50 text-slate-300">Source: {memory.source_type}</Badge>}
                            </div>
                        </DetailSection>
                         <DetailSection title="Semantic Insights">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className={getImportanceClass(memory.importance)}>Importance: {memory.importance.toFixed(1)}</Badge>
                                {memory.sentiment && <Badge variant="outline" className={getSentimentClass(memory.sentiment)}>{memory.sentiment}</Badge>}
                                {hasMatchType('semantic') && (
                                    <div className="relative group">
                                        <span className="flex items-center bg-purple-600/20 text-purple-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            <BrainCircuit className="w-3 h-3 mr-1.5" />
                                            Semantic Match
                                        </span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            This memory was recalled based on meaning, not just keywords.
                                            <div className="tooltip-arrow" data-popper-arrow></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DetailSection>
                    </div>
                    {/* Right side metadata */}
                    <div className="space-y-6">
                         {memory.reference_links && memory.reference_links.length > 0 && (
                            <DetailSection title="References">
                                <div className="flex flex-wrap gap-2">
                                    {memory.reference_links.map(link => (
                                        <a href={link} target="_blank" rel="noopener noreferrer" key={link}>
                                            <Badge variant="secondary" className="bg-sky-800/70 text-sky-200/90 hover:bg-sky-700/80 flex items-center gap-1">
                                                <Link className="h-3 w-3" /> {new URL(link).hostname}
                                            </Badge>
                                        </a>
                                    ))}
                                </div>
                            </DetailSection>
                        )}
                        <DetailSection title="Conversation">
                             {canReconstruct ? (
                                <Button variant="outline" className="w-full text-sky-300/80 border-sky-700/40 hover:bg-sky-700/20 hover:text-sky-200 hover:border-sky-600/60">
                                    <Bot className="h-4 w-4 mr-2" /> Reconstruct Conversation
                                </Button>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No conversation context available.</p>
                            )}
                        </DetailSection>
                    </div>
                </div>
            </div>
        </ScrollArea>

        <DialogFooter className="p-4 flex justify-between items-center border-t border-slate-700/50 bg-slate-800/50">
            <div>
                 <Button variant="ghost" size="sm" onClick={() => setShowRawMetadata(!showRawMetadata)} className="text-xs text-slate-400 hover:bg-slate-700/60 hover:text-slate-200">
                     {showRawMetadata ? <ChevronUp className="h-3.5 w-3.5 mr-1" /> : <ChevronDown className="h-3.5 w-3.5 mr-1" />}
                     Developer Info
                </Button>
            </div>
            <div className='flex gap-2'>
                <Button variant="outline" onClick={onClose} className="bg-slate-700/50 border-slate-600/70 text-slate-300 hover:bg-slate-600/60 hover:text-sky-300 focus:ring-sky-500 focus:ring-offset-slate-800">
                    Close
                </Button>
                <Button variant="destructive" onClick={() => onDelete(memory.id)} className="bg-red-700/80 text-red-100 hover:bg-red-600/80 focus:ring-red-500 focus:ring-offset-slate-800">
                    Delete Memory
                </Button>
            </div>
        </DialogFooter>
         {showRawMetadata && (
            <div className="p-4 border-t border-slate-700 bg-slate-900/80 max-h-48 overflow-y-auto">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all">
                    {JSON.stringify(memory, null, 2)}
                </pre>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
