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
import { findCodeBlocks } from '@/lib/import/codeDetection';

import { 
  MessageContent,
  TagHighlighting,
  ScrollToFeature,
  useTagHighlight,
  useContentDetection,
  isImageContent,
  isCodeContent,
  isVoiceContent,
  FileSelector,
  safeRenderContent,
  CardWrapper,
  CardHeaderWrapper,
  CardContentWrapper
} from './shared';

// Helper functions at the top level
const countContentType = (messages: any[], type: 'voice' | 'image' | 'code'): number => {
  if (!messages || !Array.isArray(messages)) return 0;

  // Debug log the input messages
  console.log(`Counting ${type} content in conversation:`, {
    messageCount: messages?.length,
    conversationId: messages?.[0]?.conversationId,
    firstMessage: messages?.[0] ? {
      id: messages[0].id,
      content: typeof messages[0].content === 'string' ? messages[0].content.slice(0, 100) : messages[0].content,
      metadata: messages[0].metadata
    } : null
  });

  // Use the same detection logic as the tag click handler
  const detectedMessages = messages.filter(msg => {
    if (!msg) return false;
    
    let isDetected = false;
    let detectionReason = '';
    
    switch (type) {
      case 'voice':
        isDetected = isVoiceContent(msg);
        detectionReason = 'voice content';
        break;
      case 'image':
        isDetected = isImageContent(msg);
        if (isDetected) {
          detectionReason = msg.metadata?.type === 'image' ? 'metadata type' :
                           msg.isImage ? 'isImage flag' :
                           msg.content?.includes('[Unknown Content]') ? 'unknown content' :
                           'other image marker';
          console.log('Counter: Message detected as image:', {
            id: msg.id,
            reason: detectionReason,
            content: typeof msg.content === 'string' ? msg.content.slice(0, 100) : msg.content,
            metadata: msg.metadata
          });
        }
        break;
      case 'code':
        isDetected = isCodeContent(msg);
        if (isDetected) {
          // Log what code blocks were found
          const text = safeRenderContent(msg.content);
          if (typeof text === 'string') {
            const blocks = findCodeBlocks(text);
            console.log('Counter: Message detected as code:', {
              id: msg.id,
              blocks: blocks.map(block => ({
                type: block.type,
                content: block.content.slice(0, 100) + (block.content.length > 100 ? '...' : ''),
                start: block.start,
                end: block.end
              }))
            });
          }
        }
        break;
    }
    return isDetected;
  });

  // Log detection results for debugging
  console.log(`Found ${detectedMessages.length} messages with ${type} content:`, 
    detectedMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      metadata: msg.metadata
    }))
  );

  return detectedMessages.length;
};

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

// Preprocessing Options Component
const PreprocessingOptions = ({ config, setConfig, saveAndApplyPreprocessing }) => (
  <div className="flex items-center space-x-4 mb-4 p-2 bg-gray-800/50 rounded-md">
    <div className="flex items-center space-x-2">
      <Checkbox 
        id="removeCode" 
        checked={config.removeCodeBlocks}
        onCheckedChange={(checked) => {
          setConfig({ ...config, removeCodeBlocks: checked });
          // Re-apply preprocessing when this changes
          saveAndApplyPreprocessing();
        }}
      />
      <Label htmlFor="removeCode">Remove Code</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900/95 border-slate-700 text-slate-200 shadow-xl max-w-[380px]">
            <div className="text-xs space-y-1.5">
              <div className="font-semibold text-slate-100">Code Removal</div>
              <p>Removes only the highlighted code. Non-code context stays.</p>
              <p className="mt-1">Placeholders inserted:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  Multi-line: <span className="font-mono">[JAVASCRIPT Block]</span> or <span className="font-mono">[Code Block]</span>
                </li>
                <li>
                  Inline: <span className="font-mono">[Inline Code]</span>
                </li>
              </ul>
              <p className="mt-1 text-slate-400">Images and transcripts are never removed.</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
);

export const PreprocessedPreview = () => {
  const formatTs = (value: any) => {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    const ms = n < 1e12 ? Math.round(n * 1000) : Math.round(n);
    try {
      return new Date(ms).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return null;
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
    handleSelectAllUserOnly,
    saveAndApplyPreprocessing,
    isLoading,
    currentStage,
    selectedModel,
    setSelectedModel,
    handleEnrichStream,
    // unified selector helpers
    selectedPreprocessedFile,
    selectedEnrichedFile,
    selectedSourceFile,
    setSelectedSourceFile,
    preprocessedFileName,
    handleLoadPreprocessedFile,
    // reuse existing isLoading above
    setSelectedPreprocessedFile,
    handleSelectEnrichedFile,
    handlePreviewEnrichedFile,
    handleLoadFromFile,
    setSelectedEnrichedFile,
    file,
    handleProcess,
    addLog,
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
  const allUserOnlySelected = conversations.length > 0 && conversations.every(c => userOnlySelection.has(c.id));

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
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAllUserOnly"
                    checked={allUserOnlySelected}
                    onCheckedChange={(checked) => handleSelectAllUserOnly(Boolean(checked))}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <Label htmlFor="selectAllUserOnly" className="text-sm text-slate-300">
                    User only
                  </Label>
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          {/* Step 2: Prepare Data */}
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/50 flex items-center justify-center text-sm font-bold">2</div>
                  <h3 className="text-lg font-semibold text-slate-100">Prepare Data</h3>
                </div>
                <p className="text-sm text-slate-300 mt-1">Select conversations and apply preprocessing options.</p>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 max-w-2xl">
                    <div className="flex-1 min-w-[320px]">
                      <FileSelector
                        selectedFile={selectedEnrichedFile || selectedPreprocessedFile || null}
                        onFileSelect={async (filename, type) => {
                          if (type === 'preprocessed') setSelectedPreprocessedFile(filename || null);
                          if (type === 'enriched') handleSelectEnrichedFile(String(filename));
                          if (type === 'source') {
                            setSelectedSourceFile(filename || null);
                            setSelectedPreprocessedFile(null);
                            setSelectedEnrichedFile(null);
                          }
                        }}
                        disabled={isLoading}
                        placeholder="Select file..."
                        showNewOption={true}
                        compact={true}
                        refreshKey={preprocessedFileName || null}
                        // Show both types everywhere for consistency
                        allowedTypes={undefined}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={async () => {
                          try { addLog('[Step2] Preview clicked'); } catch {}
                          try { addLog(`[Step2] current selections => preprocessed:${Boolean(selectedPreprocessedFile)} enriched:${Boolean(selectedEnrichedFile)} sourceFile:${Boolean(file)}`); } catch {}
                          if (selectedEnrichedFile) {
                            try { addLog('[Step2] preview enriched'); } catch {}
                            await handlePreviewEnrichedFile();
                            return;
                          }
                          if (selectedPreprocessedFile) {
                            try { addLog('[Step2] load preprocessed'); } catch {}
                            await handleLoadPreprocessedFile(selectedPreprocessedFile);
                            return;
                          }
                          // If a source JSON was selected in this session, process it client-side
                          if (file) {
                            try { addLog('[Step2] process source JSON'); } catch {}
                            await handleProcess();
                          }
                        }}
                        disabled={isLoading || (!selectedPreprocessedFile && !selectedEnrichedFile && !file)}
                        variant="outline"
                        className="h-8"
                      >
                        Preview
                      </Button>
                      {selectedEnrichedFile && (
                        <Button
                          onClick={handleLoadFromFile}
                          disabled={isLoading}
                          className="h-8"
                        >
                          Load to DB
                        </Button>
                      )}
                    </div>
                  </div>
                  {selectedSourceFile && file && !selectedPreprocessedFile && !selectedEnrichedFile && (
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="sourceLast50"
                          checked={Boolean((config as any).demoLimitEnabled)}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, demoLimitEnabled: Boolean(checked), demoLimitConversations: 50 }))}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <Label htmlFor="sourceLast50" className="text-xs text-slate-300">
                          Load only last 50 conversations (fast demo)
                        </Label>
                      </div>
                      <span>{Math.round((file.size / (1024 * 1024)) * 10) / 10} MB</span>
                    </div>
                  )}
                  {/* Unified selector only: if enriched selected from dropdown list, we will navigate elsewhere */}
                </div>
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
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAllUserOnly2"
                    checked={allUserOnlySelected}
                    onCheckedChange={(checked) => handleSelectAllUserOnly(Boolean(checked))}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <Label htmlFor="selectAllUserOnly2" className="text-sm text-slate-300">
                    User only
                  </Label>
                </div>
                </div>

                {/* Code Removal Option */}
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="removeCode"
                    checked={config.removeCodeBlocks}
                    onCheckedChange={(checked) => {
                      setConfig({ ...config, removeCodeBlocks: checked });
                      saveAndApplyPreprocessing();
                    }}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <Label htmlFor="removeCode" className="text-sm text-slate-300">Remove Code</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900/95 border-slate-700 text-slate-200 shadow-xl max-w-[380px]">
                        <div className="text-xs space-y-1.5">
                          <div className="font-semibold text-slate-100">Code Removal</div>
                          <p>Removes only the highlighted code. Non-code context stays.</p>
                          <p className="mt-1">Placeholders inserted:</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>
                              Multi-line: <span className="font-mono">[JAVASCRIPT Block]</span> or <span className="font-mono">[Code Block]</span>
                            </li>
                            <li>
                              Inline: <span className="font-mono">[Inline Code]</span>
                            </li>
                          </ul>
                          <p className="mt-1 text-slate-400">Images and transcripts are never removed.</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                                    Voice ({countContentType(convo.messages, 'voice')})
                                  </Badge>
                                )}

                                {(() => {
                                  // Use shared image detection
                                  const imageCount = convo.messages?.reduce((count, msg) => {
                                    if (!msg) return count;
                                    const isImage = isImageContent(msg);
                                    if (isImage) {
                                      console.log('UI Counter: Found image in message:', {
                                        conversationId: convo.id,
                                        conversationTitle: convo.title || convo.topic,
                                        messageId: msg.id,
                                        content: typeof msg.content === 'string' ? msg.content.slice(0, 100) : msg.content,
                                        metadata: msg.metadata,
                                        flags: {
                                          isImage: msg.isImage,
                                          type: msg.type,
                                          messageType: msg.message_type
                                        }
                                      });
                                    }
                                    return count + (isImage ? 1 : 0);
                                  }, 0) || 0;
                                  
                                  if (imageCount > 0) {
                                    console.log(`UI Counter: Found ${imageCount} images in conversation:`, {
                                      conversationId: convo.id,
                                      conversationTitle: convo.title || convo.topic,
                                      messageCount: convo.messages?.length
                                    });
                                  }
                                  
                                  return imageCount > 0 && (
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
                                      Image ({imageCount})
                                    </Badge>
                                  );
                                })()}
                                
                                {/* Add Code tag */}
                                {contentTypes.hasCode && (
                                  <Badge 
                                    variant="secondary" 
                                    className={cn(
                                      "text-xs cursor-pointer transition-all duration-200 hover:scale-105",
                                      "bg-cyan-950/40 border-cyan-500/40 text-cyan-300",
                                      "hover:bg-cyan-950/50 hover:border-cyan-400/50",
                                      "shadow-[0_0_10px_rgba(34,211,238,0.1)]",
                                      "hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                                    )}
                                    onClick={(e) => handleTagClick('code', convo.id, e, conversations)}
                                  >
                                    <Code className="h-3 w-3 mr-1" />
                                    Code ({countContentType(convo.messages, 'code')})
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                              <span>{convo.messages?.length || 0} messages</span>
                              {formatTs(convo.create_time) && (
                                <span>{formatTs(convo.create_time)}</span>
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
                          const hasCodePlaceholder = typeof msg.content === 'string' && /\[(?:Inline Code|[A-Z]+\s+Block|Code Block)\]/i.test(msg.content);
                          
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
                                msg.author === 'user' || msg.role === 'user' ? 'bg-blue-950/60 border-blue-800/60' : 'bg-slate-800/60 border-cyan-800/40'
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
                                  (hasImage || msg.content?.includes('"prompt":')) && !hasVoice && "bg-indigo-900/40 border-indigo-600/50 text-indigo-200",
                                  // Code content highlighting - cyan theme (actual code)
                                  hasCode && "bg-cyan-950/40 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.1)]",
                                  // Default styling (placeholder-only should NOT highlight the message id)
                                  !hasVoice && !hasImage && !hasCode && "bg-slate-800/60 border-slate-600/70 text-slate-300"
                                )}>
                                  {msg.id}
                                  {formatTs((msg as any).timestamp) && (
                                    <span className="ml-2 opacity-70">{formatTs((msg as any).timestamp)}</span>
                                  )}
                                </span>
                              </div>
                              
                                                              <MessageContent 
                                  content={msg.content} 
                                  isImage={hasImage}
                                  isVoice={hasVoice}
                                  showRemovableCode={config.removeCodeBlocks && hasCode}
                                  hasTranscript={hasTranscript}
                                  author={msg.author}
                                  role={msg.role}
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