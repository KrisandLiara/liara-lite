import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, HelpCircle, Sparkles, Brain, Eye, Zap, MessageSquare, DollarSign, Clock, AlertCircle, Hash, Image as ImageIcon, Code, Mic, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useImport } from '@/contexts/ImportContext';
import { 
  MODEL_PRICING,
  calculateTokensForEnrichment, 
  calculateCostForModel, 
  formatCurrency, 
  formatTime 
} from '@/lib/import/tokenEstimator';

import { 
  MessageContent,
  TagHighlighting,
  ScrollToFeature,
  useTagHighlight,
  useContentDetection,
  FileSelector,
  safeRenderContent,
  CardWrapper,
  CardHeaderWrapper,
  CardContentWrapper
} from './shared';

// Add this helper function at the top level
const getConversationTitle = (convo: any, index: number) => {
  // Try to get title from different possible sources
  if (convo.title) return convo.title;
  if (convo.topic) return convo.topic;
  
  // If no title, try to extract from first message
  if (convo.messages && convo.messages.length > 0) {
    const firstMsg = convo.messages[0];
    const content = firstMsg.content;
    if (typeof content === 'string') {
      // Take first 50 chars of first message
      const preview = content.slice(0, 50).trim();
      return preview + (content.length > 50 ? '...' : '');
    }
  }
  
  // Fallback to generic name
  return `Chat Session ${index + 1}`;
};

// Enrichment Section Component
const EnrichmentSection = () => {
  const {
    isLoading,
    currentStage,
    preprocessedData,
    includeSelection,
    config,
    selectedModel,
    setSelectedModel,
    handleEnrichStream,
  } = useImport();

  const getSelectedConversations = useMemo(() => {
    if (!preprocessedData || preprocessedData.length === 0) return [];
    return preprocessedData.filter(convo => includeSelection.has(convo.id));
  }, [preprocessedData, includeSelection]);

  const tokenData = useMemo(() => {
    if (!preprocessedData || preprocessedData.length === 0) return null;
    
    const selectedConvs = getSelectedConversations;
    const totalTokens = calculateTokensForEnrichment(selectedConvs, { enableNER: config.enableNER, nerUserOnly: config.nerUserOnly });
    const costEstimate = calculateCostForModel(totalTokens, selectedModel, { enableNER: config.enableNER, nerUserOnly: config.nerUserOnly });
    
    return {
      conversations: selectedConvs.length,
      messages: selectedConvs.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0),
      cost: formatCurrency(costEstimate.totalCost),
      time: formatTime(costEstimate.estimatedTime)
    };
  }, [preprocessedData, includeSelection, config.enableNER, config.nerUserOnly, selectedModel]);

  const handleEnrichClick = () => {
    const conversationsToProcess = preprocessedData.filter(c => includeSelection.has(c.id));
    const [mode, amountStr] = config.enrichmentScope.split('-');
    const amount = parseInt(amountStr, 10);
    
    let conversationsForEnrichment;
    if (mode === 'conversations') {
      conversationsForEnrichment = amount === -1 ? conversationsToProcess : conversationsToProcess.slice(0, amount);
    } else {
      conversationsForEnrichment = conversationsToProcess;
    }
    
    handleEnrichStream(conversationsForEnrichment);
  };

  if (!preprocessedData || preprocessedData.length === 0) {
    return (
      <div className="text-sm text-gray-400 leading-tight">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          No preprocessed data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Token Usage - Always Visible */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-blue-400" />
          <span className="text-gray-300">{tokenData?.conversations || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <Hash className="w-3 h-3 text-green-400" />
          <span className="text-gray-300">{tokenData?.messages || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-yellow-400" />
          <span className="text-gray-300">{tokenData?.cost || '$0.00'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-purple-400" />
          <span className="text-gray-300">{tokenData?.time || '0s'}</span>
        </div>
      </div>

      {/* Model Selection - Always Visible */}
      <div className="flex items-center gap-2">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="h-8 text-xs bg-gray-800 border-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MODEL_PRICING).map(([key, model]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  {model.name}
                  {model.recommended && (
                    <span className="text-xs bg-green-600 text-white px-1 rounded">RECOMMENDED</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={handleEnrichClick}
          disabled={isLoading || includeSelection.size === 0}
          className="h-8 px-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
        >
          {isLoading && currentStage === 'enriching' ? (
            <>
              <span className="animate-spin mr-1">⚡</span>
              Configure & Enrich
            </>
          ) : (
            <>
              <span className="mr-1">⚡</span>
              Configure & Enrich
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export const PreprocessedPreview = () => {
  const {
    tagMessageIndex,
    openAccordion,
    setOpenAccordion,
    handleTagClick,
    setMessageRef,
    messageRefs
  } = useTagHighlight();

  const {
    preprocessedData,
    enrichSelection,
    includeSelection,
    userOnlySelection,
    config,
    setConfig,
    handleEnrichSelect,
    handleIncludeSelect,
    handleUserOnlySelect,
    handleSelectAllEnrich,
    handleSelectAllInclude,
    saveAndApplyPreprocessing,
    isLoading,
    currentStage,
    selectedModel,
    setSelectedModel,
    handleEnrichStream,
  } = useImport();

  const {
    isProblematicVoiceConversation,
    isProblematicImageConversation,
    detectContentTypes,
    getMessageTypeIndicators
  } = useContentDetection();

  const conversations = preprocessedData;
  const isEnrichedData = false;

  // Calculate selection states
  const allIncludeSelected = conversations.length > 0 && conversations.every(c => includeSelection.has(c.id));
  const allEnrichSelected = conversations.length > 0 && conversations.every(c => enrichSelection.has(c.id));

  if (!conversations || conversations.length === 0) {
    return (
      <CardWrapper>
        <CardHeaderWrapper className="pb-4">
          {/* Split Header: Step 2 & Step 3 Side by Side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/50 flex items-center justify-center text-sm font-bold">2</div>
                <h3 className="text-lg font-semibold text-slate-100">Prepare Data</h3>
              </div>
              <p className="text-sm text-slate-300 mt-1">Select conversations and apply preprocessing options.</p>
            </div>
            
            <div className="flex items-center gap-3 ml-4">
              <div className="text-sm text-slate-300">
                <span className="font-medium text-sky-400">{includeSelection.size}</span> of <span className="font-medium">{conversations.length}</span> selected
              </div>
              <Button 
                onClick={saveAndApplyPreprocessing}
                disabled={includeSelection.size === 0}
                className="h-8"
              >
                Apply & Save
              </Button>
            </div>
          </div>

          {/* Preprocessing Controls */}
          <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-200">Preprocessing Options</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAllInclude"
                    checked={allIncludeSelected}
                    onCheckedChange={handleSelectAllInclude}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="selectAllInclude" className="text-sm text-slate-300">Select All</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAllEnrich"
                    checked={allEnrichSelected}
                    onCheckedChange={handleSelectAllEnrich}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <Label htmlFor="selectAllEnrich" className="text-sm text-slate-300">Enrich All</Label>
                </div>
              </div>
            </div>
          </div>
        </CardHeaderWrapper>
        <CardContentWrapper>
          {/* Step 3: AI Enrichment */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-sm font-bold">3</div>
                <h3 className="text-lg font-semibold text-slate-100">AI Enrichment</h3>
              </div>
              <p className="text-sm text-slate-300 mt-1">Generate tags, summaries, and embeddings with AI processing.</p>
            </div>

            {/* Token Usage Estimate */}
            <div className="p-3 bg-emerald-900/20 border border-emerald-600/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-emerald-200">Token Usage Estimate</span>
              </div>
              <EnrichmentSection />
            </div>
          </div>
        </CardContentWrapper>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper>
      <CardHeaderWrapper className="pb-4">
        {/* Split Header: Step 2 & Step 3 Side by Side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Step 2: Prepare Data */}
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/50 flex items-center justify-center text-sm font-bold">2</div>
                  <h3 className="text-lg font-semibold text-slate-100">Prepare Data</h3>
                </div>
                <p className="text-sm text-slate-300 mt-1">Select conversations and apply preprocessing options.</p>
              </div>
              
              <div className="flex items-center gap-3 ml-4">
                <div className="text-sm text-slate-300">
                  <span className="font-medium text-sky-400">{includeSelection.size}</span> of <span className="font-medium">{conversations.length}</span> selected
                </div>
                <Button 
                  onClick={saveAndApplyPreprocessing}
                  disabled={includeSelection.size === 0}
                  className="h-8"
                >
                  Apply & Save
                </Button>
              </div>
            </div>

            {/* Preprocessing Controls */}
            <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-200">Preprocessing Options</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="selectAllInclude"
                      checked={allIncludeSelected}
                      onCheckedChange={handleSelectAllInclude}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="selectAllInclude" className="text-sm text-slate-300">Select All</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="selectAllEnrich"
                      checked={allEnrichSelected}
                      onCheckedChange={handleSelectAllEnrich}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label htmlFor="selectAllEnrich" className="text-sm text-slate-300">Enrich All</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: AI Enrichment */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-sm font-bold">3</div>
                <h3 className="text-lg font-semibold text-slate-100">AI Enrichment</h3>
              </div>
              <p className="text-sm text-slate-300 mt-1">Generate tags, summaries, and embeddings with AI processing.</p>
            </div>

            {/* Token Usage Estimate */}
            <div className="p-3 bg-emerald-900/20 border border-emerald-600/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-emerald-200">Token Usage Estimate</span>
              </div>
              <EnrichmentSection />
            </div>
          </div>
        </div>
      </CardHeaderWrapper>

      <CardContentWrapper>
        <Accordion
          type="single"
          collapsible
          value={openAccordion}
          onValueChange={setOpenAccordion}
          className="space-y-3"
        >
          {conversations.map((convo, index) => {
            // Detect content types for this conversation
            const contentTypes = detectContentTypes(convo);
            const hasProblematicVoice = isProblematicVoiceConversation(convo);
            const hasProblematicImage = isProblematicImageConversation(convo);

            return (
              <AccordionItem
                key={convo.id}
                value={convo.id}
                className="border border-slate-700/50 rounded-lg overflow-hidden"
              >
                <div className="flex">
                  {/* Checkboxes - Moved outside AccordionTrigger */}
                  <div 
                    className="flex items-center space-x-3 p-4 bg-slate-800/30 border-r border-slate-700/50"
                  >
                    <div className="flex flex-col items-center">
                      <Checkbox 
                        aria-label="Include in Load"
                        checked={includeSelection.has(convo.id)}
                        onCheckedChange={(checked) => handleIncludeSelect(convo.id, Boolean(checked))}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label htmlFor="" className="text-xs text-slate-400 mt-1">Include</Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <Checkbox
                        aria-label="Enrich"
                        checked={enrichSelection.has(convo.id)}
                        onCheckedChange={(checked) => handleEnrichSelect(convo.id, Boolean(checked))}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <Label htmlFor="" className="text-xs text-slate-400 mt-1">Enrich</Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <Checkbox
                        aria-label="User Only Enrichment"
                        checked={userOnlySelection.has(convo.id)}
                        onCheckedChange={(checked) => handleUserOnlySelect(convo.id, Boolean(checked))}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <Label htmlFor="" className="text-xs text-slate-400 mt-1">User Only</Label>
                    </div>
                  </div>
                  
                  <AccordionTrigger className="flex-1 px-6 hover:no-underline hover:bg-slate-800/50 [&[data-state=open]]:bg-slate-800/50">
                    <div 
                      className="flex items-center w-full border-b border-slate-700/50 hover:border-slate-600/70 transition-colors cursor-pointer hover:bg-slate-800/20"
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
                                {getConversationTitle(convo, index)}
                              </span>
                              
                              {/* Content Type Tags */}
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                {contentTypes.hasVoiceContent && (
                                  <Badge 
                                    variant="secondary" 
                                    className={cn(
                                      "text-xs cursor-pointer transition-all duration-200 hover:scale-105",
                                      contentTypes.hasProblematicVoice
                                        ? "bg-amber-900/20 text-amber-400 border-amber-500/50 hover:bg-amber-900/30"
                                        : "bg-amber-900/60 border-amber-600/70 text-amber-300 hover:bg-amber-900/80"
                                    )}
                                    onClick={(e) => handleTagClick('voice', convo.id, e, conversations)}
                                  >
                                    <Mic className="h-3 w-3 mr-1" />
                                    Voice
                                  </Badge>
                                )}

                                {contentTypes.hasImages && (
                                  <Badge 
                                    variant="secondary" 
                                    className={cn(
                                      "text-xs cursor-pointer transition-all duration-200 hover:scale-105",
                                      contentTypes.hasProblematicImages
                                        ? "bg-indigo-900/20 text-indigo-400 border-indigo-500/50 hover:bg-indigo-900/30"
                                        : "bg-indigo-900/60 border-indigo-600/70 text-indigo-300 hover:bg-indigo-900/80"
                                    )}
                                    onClick={(e) => handleTagClick('image', convo.id, e, conversations)}
                                  >
                                    <ImageIcon className="h-3 w-3 mr-1" />
                                    Image
                                  </Badge>
                                )}
                                
                                {/* Add Code tag */}
                                {contentTypes.hasCode && (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs cursor-pointer transition-all duration-200 hover:scale-105 bg-purple-900/60 border-purple-600/70 text-purple-300 hover:bg-purple-900/80"
                                    onClick={(e) => handleTagClick('code', convo.id, e, conversations)}
                                  >
                                    <Code className="h-3 w-3 mr-1" />
                                    Code
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                              <span>{convo.messages?.length || 0} messages</span>
                              {convo.create_time && (
                                <span>{new Date(convo.create_time).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                </div>
                
                <AccordionContent className="px-6 pb-6">
                  {/* Conversation Preview - Compact with scroll */}
                  <div className="space-y-4">
                    {/* Tag Highlighting */}
                    {convo.tags && convo.tags.length > 0 && (
                      <TagHighlighting 
                        tags={convo.tags}
                        onTagClick={(tag, event) => handleTagClick(tag, convo.id, event, conversations)}
                        conversationId={convo.id}
                      />
                    )}

                    {/* Messages - Scrollable container */}
                    <div className="messages-scroll-container relative max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="space-y-3">
                        {convo.messages?.map((msg, msgIndex) => {
                          // Get message type indicators
                          const {
                            hasCode,
                            hasImage,
                            hasVoice,
                            hasTranscript,
                            isProblematicVoice,
                            isProblematicImage
                          } = getMessageTypeIndicators(msg);
                          
                          return (
                            <div 
                              key={msgIndex}
                              ref={(el) => {
                                // Log the ref being set
                                console.log('Setting ref for message:', `${convo.id}-${msgIndex}`);
                                setMessageRef(convo.id, msgIndex, el);
                              }}
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
                                  // Voice content highlighting - amber theme
                                  hasVoice && "bg-amber-900/40 border-amber-600/50 text-amber-200",
                                  // Image content highlighting - indigo theme
                                  hasImage && !hasVoice && "bg-indigo-900/40 border-indigo-600/50 text-indigo-200",
                                  // Code content highlighting - purple theme
                                  hasCode && !hasVoice && !hasImage && "bg-purple-900/60 border-purple-600/70 text-purple-300",
                                  // Default styling
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
  );
}; 