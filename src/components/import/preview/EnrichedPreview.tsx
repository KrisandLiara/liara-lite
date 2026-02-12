import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, HelpCircle, Sparkles, Brain, Eye, Zap, MessageSquare, DollarSign, Clock, AlertCircle, Hash, Image as ImageIcon, Code, Mic, Settings, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useImport } from '@/contexts/ImportContext';

import { 
  MessageContent,
  TagHighlighting,
  ScrollToFeature,
  useTagHighlight,
  useContentDetection,
  CardWrapper,
  CardHeaderWrapper,
  CardContentWrapper
} from './shared';
import { FileSelector } from './shared';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// Helpers to surface enriched info (summary, tags, NER)
function getTopTags(convo: any, limit: number = 5): Array<{ tag: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const msg of convo?.messages || []) {
    const tags: string[] = msg?.tags || [];
    for (const t of tags) {
      if (!t) continue;
      counts[t] = (counts[t] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

type EntityMap = Record<string, Array<{ text: string; count: number }>>;
function aggregateEntities(convo: any, maxPerCategory: number = 3): EntityMap {
  const result: Record<string, Record<string, number>> = {};
  for (const msg of convo?.messages || []) {
    const ne = msg?.named_entities;
    if (!ne || typeof ne !== 'object') continue;
    for (const [category, items] of Object.entries(ne)) {
      if (!Array.isArray(items)) continue;
      result[category] = result[category] || {};
      for (const item of items) {
        if (typeof item !== 'string' || item.trim().length === 0) continue;
        const key = item.trim();
        result[category][key] = (result[category][key] || 0) + 1;
      }
    }
  }
  const final: EntityMap = {};
  for (const [cat, map] of Object.entries(result)) {
    const top = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxPerCategory)
      .map(([text, count]) => ({ text, count }));
    if (top.length > 0) final[cat] = top;
  }
  return final;
}

function entityCategoryStyles(category: string): string {
  switch (category) {
    case 'PERSON':
      return 'bg-purple-900/40 border-purple-600/60 text-purple-200';
    case 'ORG':
      return 'bg-emerald-900/40 border-emerald-600/60 text-emerald-200';
    case 'GPE':
      return 'bg-sky-900/40 border-sky-600/60 text-sky-200';
    case 'DATE':
      return 'bg-cyan-900/40 border-cyan-600/60 text-cyan-200';
    case 'PRODUCT':
      return 'bg-indigo-900/40 border-indigo-600/60 text-indigo-200';
    case 'EVENT':
      return 'bg-amber-900/40 border-amber-600/60 text-amber-200';
    default:
      return 'bg-slate-800/60 border-slate-600/70 text-slate-300';
  }
}

function nerTone(category: string): string {
  switch (category) {
    case 'PERSON': return 'violet';
    case 'ORG': return 'emerald';
    case 'GPE': return 'sky';
    case 'DATE': return 'cyan';
    case 'PRODUCT': return 'indigo';
    case 'EVENT': return 'amber';
    default: return 'slate';
  }
}

function categoryLeftBgStyles(category: string): string {
  switch (category) {
    case 'PERSON': return 'bg-purple-800/60 text-purple-100';
    case 'ORG': return 'bg-emerald-800/60 text-emerald-100';
    case 'GPE': return 'bg-sky-800/60 text-sky-100';
    case 'DATE': return 'bg-cyan-800/60 text-cyan-100';
    case 'PRODUCT': return 'bg-indigo-800/60 text-indigo-100';
    case 'EVENT': return 'bg-amber-800/60 text-amber-100';
    default: return 'bg-slate-800/60 text-slate-100';
  }
}

function tagColorClasses(color?: string): string {
  switch (color) {
    case 'emerald': return 'bg-emerald-900/30 border-emerald-600/60 text-emerald-200 hover:bg-emerald-900/50';
    case 'sky': return 'bg-sky-900/30 border-sky-600/60 text-sky-200 hover:bg-sky-900/50';
    case 'violet': return 'bg-violet-900/30 border-violet-600/60 text-violet-200 hover:bg-violet-900/50';
    case 'amber': return 'bg-amber-900/30 border-amber-600/60 text-amber-200 hover:bg-amber-900/50';
    case 'indigo': return 'bg-indigo-900/30 border-indigo-600/60 text-indigo-200 hover:bg-indigo-900/50';
    case 'rose': return 'bg-rose-900/30 border-rose-600/60 text-rose-200 hover:bg-rose-900/50';
    case 'lime': return 'bg-lime-900/30 border-lime-600/60 text-lime-200 hover:bg-lime-900/50';
    case 'cyan': return 'bg-cyan-900/30 border-cyan-600/60 text-cyan-200 hover:bg-cyan-900/50';
    case 'fuchsia': return 'bg-fuchsia-900/30 border-fuchsia-600/60 text-fuchsia-200 hover:bg-fuchsia-900/50';
    case 'yellow': return 'bg-yellow-900/30 border-yellow-600/60 text-yellow-200 hover:bg-yellow-900/50';
    default: return 'bg-slate-800/60 border-slate-600/60 text-slate-200 hover:bg-slate-700/60';
  }
}

function underlineDecorClasses(color?: string): string {
  switch (color) {
    case 'emerald': return 'decoration-emerald-400/80';
    case 'sky': return 'decoration-sky-400/80';
    case 'violet': return 'decoration-violet-400/80';
    case 'amber': return 'decoration-amber-400/80';
    case 'indigo': return 'decoration-indigo-400/80';
    case 'rose': return 'decoration-rose-400/80';
    case 'lime': return 'decoration-lime-400/80';
    case 'cyan': return 'decoration-cyan-400/80';
    case 'fuchsia': return 'decoration-fuchsia-400/80';
    case 'yellow': return 'decoration-yellow-400/80';
    default: return 'decoration-slate-400/70';
  }
}

// Build top and rest entity counts per category
function aggregateEntitiesWithRest(convo: any, maxPerCategory: number = 4): Record<string, { top: Array<{ text: string; count: number }>; rest: Array<{ text: string; count: number }> }> {
  const result: Record<string, Record<string, number>> = {};
  for (const msg of convo?.messages || []) {
    const ne = msg?.named_entities;
    if (!ne || typeof ne !== 'object') continue;
    for (const [category, items] of Object.entries(ne)) {
      if (!Array.isArray(items)) continue;
      result[category] = result[category] || {};
      for (const item of items) {
        if (typeof item !== 'string' || item.trim().length === 0) continue;
        const key = item.trim();
        result[category][key] = (result[category][key] || 0) + 1;
      }
    }
  }
  const final: Record<string, { top: Array<{ text: string; count: number }>; rest: Array<{ text: string; count: number }> }> = {};
  for (const [cat, map] of Object.entries(result)) {
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).map(([text, count]) => ({ text, count }));
    final[cat] = { top: sorted.slice(0, maxPerCategory), rest: sorted.slice(maxPerCategory) };
  }
  return final;
}

export const EnrichedPreview = () => {
  const isLite = String(import.meta.env.VITE_LIARA_LITE || '').toLowerCase() === 'true';
  const [isDbSheetOpen, setIsDbSheetOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<any | null>(null);
  // Clear Test DB state management
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmTimeout = useRef<NodeJS.Timeout>();
  
  const handleClearClick = () => {
    if (isConfirming) {
      // Execute clear
      handleConfirmClear();
      setIsConfirming(false);
      if (confirmTimeout.current) {
        clearTimeout(confirmTimeout.current);
      }
    } else {
      // Show confirmation state
      setIsConfirming(true);
      confirmTimeout.current = setTimeout(() => {
        setIsConfirming(false);
      }, 3000); // Reset after 3 seconds
    }
  };
  const {
    tagMessageIndex,
    openAccordion,
    setOpenAccordion,
    handleTagClick,
    setMessageRef,
    messageRefs
  } = useTagHighlight();

  // Clear Test DB confirmation
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const {
    enrichedData,
    isLoading,
    isClearing,
    currentStage,
    enrichedFiles,
    selectedEnrichedFile,
    handleSelectEnrichedFile,
    handlePreviewEnrichedFile,
    // allow switching to preprocessed from here too
    selectedPreprocessedFile,
    setSelectedPreprocessedFile,
    handleLoadPreprocessedFile,
    handleLoadFromFile,
    handleConfirmClear,
    isTestMode
  } = useImport();

  const {
    detectContentTypes,
    getMessageTypeIndicators
  } = useContentDetection();

  const conversations = enrichedData || [];

  // Preview options (lightweight, mostly visual)
  const [showTags, setShowTags] = useState(true);
  const [compactMessages, setCompactMessages] = useState(true);
  const [showPlaceholders, setShowPlaceholders] = useState(true); // placeholder toggle

  // Conversation filters
  const [filterCode, setFilterCode] = useState(false);
  const [filterImages, setFilterImages] = useState(false);
  const [filterVoice, setFilterVoice] = useState(false);

  const filteredConversations = conversations.filter((convo) => {
    const types = detectContentTypes(convo);
    const noFilters = !filterCode && !filterImages && !filterVoice;
    if (noFilters) return true;
    return (
      (filterCode && types.hasCode) ||
      (filterImages && types.hasImages) ||
      (filterVoice && types.hasVoice)
    );
  });

  // Load options
  const [isTestOverride, setIsTestOverride] = useState<boolean>(isTestMode);

  const [lastSelectedType, setLastSelectedType] = useState<'preprocessed' | 'enriched'>(
    selectedEnrichedFile ? 'enriched' : selectedPreprocessedFile ? 'preprocessed' : 'enriched'
  );

  const checkDbStatus = async () => {
    if (!isLite) return { ok: true };
    const resp = await fetch('/api/lite/db/status');
    const data = await resp.json().catch(() => ({}));
    setDbStatus(data);
    return data;
  };

  const handleLiteLoadToDb = async () => {
    const s = await checkDbStatus();
    if (!s?.ok) {
      setIsDbSheetOpen(true);
      return;
    }
    await handleLoadFromFile(false);
  };

  useEffect(() => {
    if (selectedEnrichedFile) {
      setLastSelectedType('enriched');
    } else if (selectedPreprocessedFile) {
      setLastSelectedType('preprocessed');
    }
  }, [selectedEnrichedFile, selectedPreprocessedFile]);

  const handleUnifiedFileSelect = async (filename: string | null, type: 'preprocessed' | 'enriched') => {
    if (!filename) return;
    if (type === 'enriched') {
      handleSelectEnrichedFile(filename);
    } else {
      setSelectedPreprocessedFile(filename);
    }
    setLastSelectedType(type);
  };

  const handleUnifiedFilePreview = async (filename: string, type: 'preprocessed' | 'enriched') => {
    if (type === 'enriched') {
      handleSelectEnrichedFile(filename);
      await handlePreviewEnrichedFile();
    } else {
      await handleLoadPreprocessedFile(filename);
    }
    setLastSelectedType(type);
  };

  if (!conversations || conversations.length === 0) {
    return (
      <CardWrapper>
        <CardHeaderWrapper>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-sm font-bold">3</div>
            <h3 className="text-lg font-semibold text-slate-100">Load to Database</h3>
          </div>
          <p className="text-sm text-slate-300 mt-1">Review enriched data and load to database.</p>
        </CardHeaderWrapper>
        <CardContentWrapper>
          <div className="text-sm text-gray-400 leading-tight">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              No enriched data available
            </div>
          </div>
        </CardContentWrapper>
      </CardWrapper>
    );
  }

  // Cleanup confirmation timeout on unmount
  useEffect(() => {
    return () => {
      if (confirmTimeout.current) {
        clearTimeout(confirmTimeout.current);
      }
    };
  }, []);

  return (
    <>
      <CardWrapper>
        <CardContentWrapper>
        {/* Unified bubble row under headers: Stage 3 on left, Stage 4 on right */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Bubble: Stage 3 Preview Options */}
          <div className="flex-1 p-3 rounded-xl bg-slate-900/60 border border-emerald-700/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-xs font-bold">3</div>
              <div className="text-slate-200 font-medium text-sm">Preview Options</div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-emerald-500" checked={showTags} onChange={(e) => setShowTags(e.target.checked)} />
                <span className="text-slate-300">Show tags</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-emerald-500" checked={compactMessages} onChange={(e) => setCompactMessages(e.target.checked)} />
                <span className="text-slate-300">Compact messages</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-emerald-500" checked={showPlaceholders} onChange={(e) => setShowPlaceholders(e.target.checked)} />
                <span className="text-slate-300">Show placeholders</span>
              </label>
            </div>
          </div>

          {/* Bubble: Stage 4 Filters/Load Options */}
          <div className="flex-1 p-3 rounded-xl bg-slate-900/60 border border-violet-700/40">
            {/* Top toolbar for Stage 4 */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/50 flex items-center justify-center text-xs font-bold">4</div>
                <span className="text-slate-200 font-medium">Load to Database</span>
              </div>
              <div className="flex-1">
                <FileSelector
                  selectedFile={selectedEnrichedFile || selectedPreprocessedFile || null}
                  onFileSelect={handleUnifiedFileSelect}
                  onPreviewFile={handleUnifiedFilePreview}
                  disabled={isLoading}
                  placeholder="Select file..."
                  showNewOption={false}
                  compact={true}
                  // Show both types, but we'll gate actions by type
                  allowedTypes={undefined}
                />
              </div>
              <div className="flex gap-2 items-center">
                <Button 
                  onClick={async () => {
                    if (lastSelectedType === 'enriched' && selectedEnrichedFile) {
                      await handlePreviewEnrichedFile();
                    } else if (lastSelectedType === 'preprocessed' && selectedPreprocessedFile) {
                      await handleLoadPreprocessedFile(selectedPreprocessedFile);
                    }
                  }}
                  disabled={
                    isLoading ||
                    (lastSelectedType === 'enriched' && !selectedEnrichedFile) ||
                    (lastSelectedType === 'preprocessed' && !selectedPreprocessedFile)
                  }
                  variant="outline"
                  className="h-8"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                {lastSelectedType === 'enriched' && selectedEnrichedFile && (
                  <>
                    <div className="flex items-center gap-3">
                      {isLite && (
                        <Sheet open={isDbSheetOpen} onOpenChange={setIsDbSheetOpen}>
                          <SheetTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={async () => { await checkDbStatus().catch(() => {}); }}
                            >
                              <Info className="mr-2 h-4 w-4" />
                              DB Settings
                            </Button>
                          </SheetTrigger>
                          <SheetContent
                            side="right"
                            className="w-[92vw] sm:w-[520px] lg:w-[33vw] max-w-none border-slate-800 bg-slate-950/95 text-slate-100 overflow-y-auto"
                          >
                            <SheetHeader className="pr-6">
                              <SheetTitle className="text-slate-100">Liara Lite — Database loading</SheetTitle>
                              <SheetDescription className="text-slate-400">
                                In Lite, the enriched JSON file is the primary end-product. Loading to DB is optional.
                              </SheetDescription>
                            </SheetHeader>

                            <div className="mt-6 space-y-4 text-sm">
                              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                                <div className="font-semibold text-slate-200">Status</div>
                                <div className="mt-2 text-slate-300">
                                  {dbStatus?.ok ? (
                                    <span className="text-emerald-300">Connected</span>
                                  ) : (
                                    <span className="text-amber-300">Not configured</span>
                                  )}
                                </div>
                                {dbStatus?.error && (
                                  <div className="mt-2 text-xs text-slate-400">{String(dbStatus.error)}</div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="font-semibold text-slate-200">Enable DB loading</div>
                                <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                                  <li>Run <span className="font-mono text-slate-200">supabase status</span>.</li>
                                  <li>Set backend env vars: <span className="font-mono text-slate-200">SUPABASE_URL</span> and <span className="font-mono text-slate-200">SUPABASE_KEY</span> (use <span className="font-mono text-slate-200">service_role</span> for Lite).</li>
                                  <li>Restart Lite, then click <span className="font-semibold">Load to DB</span>.</li>
                                </ol>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      )}
                      {!isLite && (
                        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                          <input type="checkbox" className="accent-violet-500" defaultChecked={isTestMode} onChange={(e) => setIsTestOverride(e.target.checked)} />
                          <span>Load to Test DB</span>
                        </label>
                      )}
                      <Button 
                        onClick={() => (isLite ? handleLiteLoadToDb() : handleLoadFromFile(isTestOverride))} 
                        disabled={!selectedEnrichedFile || isLoading} 
                        className="h-8 bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        Load to DB
                      </Button>
                      {!isLite && isTestOverride && (
                        <Button 
                          variant={isConfirming ? "outline" : "destructive"}
                          size="sm"
                          onClick={handleClearClick}
                          disabled={isClearing}
                          className={cn(
                            "h-8 gap-2 transition-all duration-200",
                            isConfirming && "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          )}
                        >
                          {isClearing ? (
                            <>
                              <span className="animate-spin">⚡</span>
                              Clearing...
                            </>
                          ) : isConfirming ? (
                            <>
                              <Check className="h-4 w-4" />
                              Click to confirm
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4" />
                              Clear Test DB
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Removed filters section */}
          </div>
        </div>
        <Accordion
          type="single"
          collapsible
          value={openAccordion}
          onValueChange={setOpenAccordion}
          className="space-y-3"
        >
          {filteredConversations.map((convo, index) => {
            // Detect content types for this conversation
            const contentTypes = detectContentTypes(convo);
            const tagsForConvo: string[] = Array.from(new Set((convo.messages || []).flatMap((m: any) => m?.tags || [])));
            // Build a stable color map using hashing so colors appear
            // Separate palette for top tags so they don't visually match NER too closely
            const palette = ['rose','lime','yellow','fuchsia','emerald','indigo','sky','amber','cyan','violet'];
            const tagColorMap: Record<string,string> = {};
            tagsForConvo.forEach((t) => {
              let hash = 0;
              for (let i = 0; i < t.length; i++) hash = (hash * 31 + t.charCodeAt(i)) >>> 0;
              tagColorMap[t + '-top'] = palette[hash % palette.length];
              tagColorMap[t] = palette[(hash + 3) % palette.length];
            });

            return (
              <AccordionItem
                key={convo.id}
                value={convo.id}
                className="border border-slate-700/50 rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-6 hover:no-underline hover:bg-slate-800/50 [&[data-state=open]]:bg-slate-800/50">
                  <div
                    className="flex items-center w-full transition-colors cursor-pointer hover:bg-slate-800/20"
                    data-conversation-id={convo.id}
                    onClick={() => {
                      setOpenAccordion(openAccordion === convo.id ? '' : convo.id);
                    }}
                  >
                    {/* Main content area */}
                    <div className="flex-1 text-left py-4 transition-all duration-200 group w-full min-w-0">
                      <div className="flex flex-1 items-center justify-between w-full min-w-0">
                        <div className="flex flex-col flex-1 pr-6 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-100 text-sm group-hover:text-white transition-colors">
                              {convo.title || `Chat Session ${index + 1}`}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                            <span>{convo.messages?.length || 0} messages</span>
                            {convo.create_time && (
                              <span>{new Date(convo.create_time).toLocaleDateString()}</span>
                            )}
                          </div>

                          {/* Enriched summary (scrollable if long) */}
                          {convo.summary && (
                            <div className="mt-2 text-xs text-slate-300/90 bg-slate-900/50 border border-slate-700/50 rounded p-2 max-h-16 overflow-y-auto custom-scrollbar">
                              {convo.summary}
                            </div>
                          )}

                          {/* Top tags (aggregated from messages) + Image/Voice chips */}
                          {(() => {
                            const countsMap: Record<string, number> = {};
                            for (const m of convo.messages || []) {
                              for (const t of m?.tags || []) {
                                if (!t) continue;
                                countsMap[t] = (countsMap[t] || 0) + 1; // per-message presence
                              }
                            }
                            const allSorted = Object.entries(countsMap).sort((a,b)=>b[1]-a[1]);
                            const top = allSorted.slice(0,5).map(([tag,count])=>({tag, count}));
                            const rest = allSorted.slice(5);
                            // compute image count using shared indicators
                            let imageCount = 0;
                            let voiceCount = 0;
                            for (const m of convo.messages || []) {
                              const { hasImage, hasVoice } = getMessageTypeIndicators(m);
                              if (hasImage) imageCount++;
                              if (hasVoice) voiceCount++;
                            }
                            if (top.length === 0 && imageCount === 0 && voiceCount === 0) return null;
                            return (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {top.map(({ tag, count }) => (
                                  <span
                                    key={tag}
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); handleTagClick(tag, convo.id, e, conversations); }}
                                    className={`cursor-pointer text-[12px] px-2.5 py-1 rounded border font-medium transition-colors ${tagColorClasses(tagColorMap[tag + '-top'])}`}
                                  >
                                    {tag} <span className="opacity-70">({count})</span>
                                  </span>
                                ))}
                                {rest.length > 0 && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <span role="button" tabIndex={0} className="cursor-pointer text-[12px] px-2.5 py-1 rounded border bg-slate-800/60 border-slate-600/60 text-slate-300 hover:bg-slate-700/60">+{rest.length} more</span>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[520px] max-h-[320px] overflow-y-auto bg-slate-900 border-slate-700 text-slate-200 custom-scrollbar">
                                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] leading-6 pr-2">
                                        {rest.map(([tag,count]) => (
                                          <span
                                            key={`rest-${tag}`}
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => { e.stopPropagation(); handleTagClick(tag, convo.id, e, conversations); }}
                                            className={`cursor-pointer underline underline-offset-4 hover:opacity-80 transition-colors ${underlineDecorClasses(tagColorMap[tag])}`}
                                            title={`${count} messages`}
                                          >
                                            {tag} <span className="opacity-70">({count})</span>
                                          </span>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                                {imageCount > 0 && (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); handleTagClick('image', convo.id, e, conversations); }}
                                    className="cursor-pointer text-[12px] px-2.5 py-1 rounded border bg-indigo-900/60 border-indigo-600/70 text-indigo-300 hover:bg-indigo-900/80 transition-colors"
                                  >
                                    Image <span className="opacity-70">({imageCount})</span>
                                  </span>
                                )}
                                {voiceCount > 0 && (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); handleTagClick('voice', convo.id, e, conversations); }}
                                    className="cursor-pointer text-[12px] px-2.5 py-1 rounded border bg-amber-900/60 border-amber-600/70 text-amber-300 hover:bg-amber-900/80 transition-colors"
                                  >
                                    Voice <span className="opacity-70">({voiceCount})</span>
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-6">
                  {/* Conversation Preview - Compact with scroll */}
                  <div className="space-y-4">
                    {/* NER entities overview with +N more per category */}
                    {(() => {
                      const entities = aggregateEntitiesWithRest(convo, 4);
                      const cats = Object.keys(entities);
                      if (cats.length === 0) return null;
                      return (
                        <div className="mt-1">
                          <div className="flex flex-wrap gap-1.5">
                            {cats.map((cat) => {
                              const displayCat = cat === 'GPE' ? 'LOC' : cat;
                              return (
                              <div key={cat} className={`inline-flex items-stretch text-[11px] rounded-md border overflow-hidden ${entityCategoryStyles(cat)}`}>
                                <span className={cn("px-2 py-[2px] whitespace-nowrap", categoryLeftBgStyles(cat))}>{displayCat}</span>
                                <div className="inline-flex items-center px-2 py-[2px] gap-1.5">
                                  {entities[cat].top.map(({ text, count }, idx) => (
                                    <button
                                      key={`${cat}-${text}`}
                                      onClick={(e) => handleTagClick(`entity::${cat}::${text}`, convo.id, e, conversations)}
                                      className="hover:opacity-80 text-[11px]"
                                    >
                                      {text}<span className="opacity-70">({count})</span>
                                    </button>
                                  ))}
                                </div>
                                {entities[cat].rest.length > 0 && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="text-[11px] px-2 py-[2px] bg-slate-800/60 border-l border-slate-600/60 text-slate-200 hover:bg-slate-700/60 min-w-[22px] text-center">+{entities[cat].rest.length}</button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" sideOffset={6} className="w-[420px] max-h-[280px] overflow-y-auto bg-slate-900 border-slate-700 text-slate-200 custom-scrollbar">
                                      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] leading-6 pr-2">
                                        {entities[cat].rest.map(({ text, count }) => (
                                          <button
                                            key={`rest-${cat}-${text}`}
                                            type="button"
                                            onClick={(e) => handleTagClick(`entity::${cat}::${text}`, convo.id, e, conversations)}
                                            className="hover:opacity-80"
                                            title={`${displayCat}: ${text}`}
                                          >
                                            {text} <span className="opacity-70">({count})</span>
                                          </button>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            )})}
                          </div>
                        </div>
                      );
                    })()}
                    {/* Tag Highlighting */}
                    {showTags && convo.tags && convo.tags.length > 0 && (
                      <TagHighlighting 
                        tags={convo.tags}
                        onTagClick={(tag, event) => handleTagClick(tag, convo.id, event, conversations)}
                        conversationId={convo.id}
                      />
                    )}

                    {/* Messages - Scrollable container */}
                    <div className="messages-scroll-container relative max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className={cn("space-y-3", compactMessages && "space-y-2")}>
                        {convo.messages?.map((msg, msgIndex) => {
                          // Get message type indicators
                          const {
                            hasCode,
                            hasImage,
                            hasVoice,
                            hasTranscript
                          } = getMessageTypeIndicators(msg);
                          
                          return (
                            <div 
                              key={msgIndex}
                              ref={(el) => setMessageRef(convo.id, msgIndex, el)}
                              className={cn(
                                "p-4 my-3 rounded-lg relative border transition-all duration-300",
                                msg.author === 'user' || msg.role === 'user' ? 'bg-blue-950/60 border-blue-800/60' : 'bg-cyan-950/60 border-cyan-700/60'
                              )}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    "font-semibold capitalize text-sm",
                                    (msg.author === 'user' || msg.role === 'user') ? 'text-blue-300' : 'text-cyan-300'
                                  )}>{msg.author || msg.role}</p>
                                </div>
                              </div>
                              
                              {/* Message ID Badge - Positioned absolutely in the corner */}
                              <div className="absolute top-2 right-2 z-10">
                                <span className={cn(
                                  "text-xs font-mono px-2 py-1 rounded border shadow-sm",
                                  hasVoice && "bg-amber-900/40 border-amber-600/50 text-amber-200",
                                  hasImage && !hasVoice && "bg-indigo-900/40 border-indigo-600/50 text-indigo-200",
                                  hasCode && !hasVoice && !hasImage && "bg-purple-900/60 border-purple-600/70 text-purple-300",
                                  !hasVoice && !hasImage && !hasCode && "bg-slate-800/60 border-slate-600/70 text-slate-300"
                                )}>
                                  {msg.id}
                                </span>
                              </div>
                              
                              <MessageContent 
                                content={msg.content} 
                                isImage={hasImage}
                                isVoice={hasVoice}
                                hasTranscript={hasTranscript}
                                highlightTags={tagsForConvo}
                                tagColorMap={tagColorMap}
                                highlightEntities={msg.named_entities}
                                entityColorMap={{
                                  PERSON: 'violet', ORG: 'emerald', GPE: 'sky', DATE: 'cyan', PRODUCT: 'indigo', EVENT: 'amber', MISC: 'slate'
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Scroll to Feature */}
                    <ScrollToFeature 
                      tagMessageIndex={tagMessageIndex}
                      conversationId={convo.id}
                      messageRefs={messageRefs}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContentWrapper>
    </CardWrapper>
    </>
  );
}; 