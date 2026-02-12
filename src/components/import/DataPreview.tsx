import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useImport } from '@/contexts/ImportContext';
import { AlertTriangle, HelpCircle, Sparkles, Tag, Brain, Eye, Mic, Image, Code, ChevronDown, Loader2, Settings, Zap, Users, MessageSquare, DollarSign, Clock, AlertCircle, Hash } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { TokenInfoBlock } from '@/components/import/TokenInfoBlock';
import { 
  MODEL_PRICING,
  calculateTokensForEnrichment, 
  calculateCostForModel, 
  formatCurrency, 
  formatTime 
} from '@/lib/import/tokenEstimator';

// Helper function to safely render content
const safeRenderContent = (content) => {
  if (typeof content === 'string') {
    return content;
  } else if (typeof content === 'object' && content !== null) {
    // Handle object content - likely voice conversation data
    return JSON.stringify(content, null, 2);
  } else {
    return String(content || '');
  }
};

// Helper function to highlight NER entities in content with improved styling
const highlightNEREntities = (content: string, namedEntities: any) => {
  if (!namedEntities || typeof content !== 'string') {
    return content;
  }

  let highlightedContent = content;
  const entityColors = {
    PERSON: 'bg-purple-500/30 text-purple-200 border-b-2 border-purple-400/60',
    ORG: 'bg-green-500/30 text-green-200 border-b-2 border-green-400/60', 
    GPE: 'bg-blue-500/30 text-blue-200 border-b-2 border-blue-400/60',
    DATE: 'bg-orange-500/30 text-orange-200 border-b-2 border-orange-400/60',
    PRODUCT: 'bg-pink-500/30 text-pink-200 border-b-2 border-pink-400/60',
    EVENT: 'bg-yellow-500/30 text-yellow-200 border-b-2 border-yellow-400/60',
    MISC: 'bg-gray-500/30 text-gray-200 border-b-2 border-gray-400/60'
  };

  // Process each entity type
  Object.entries(namedEntities).forEach(([entityType, entities]) => {
    if (Array.isArray(entities)) {
      entities.forEach(entity => {
        if (entity && typeof entity === 'string') {
          const regex = new RegExp(`\\b${entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          const colorClass = entityColors[entityType] || entityColors.MISC;
          highlightedContent = highlightedContent.replace(
            regex, 
            `<span class="px-1 py-0.5 rounded-sm ${colorClass}" title="${entityType}: ${entity}">${entity}</span>`
          );
        }
      });
    }
  });

  return highlightedContent;
};

// Helper function to check if conversation has NER entities
const hasNEREntities = (convo) => {
  if (convo.named_entities && Object.keys(convo.named_entities).length > 0) return true;
  return convo.messages?.some(msg => msg.named_entities && Object.keys(msg.named_entities).length > 0) || false;
};

// Enhanced Summary Component with better styling
const ConversationSummary = ({ summary, messages, onTagClick, conversationId }) => {
  // Get top 5 most common tags from conversation messages
  const getTopTags = () => {
    if (!messages) return [];
    
    const allTags = messages
      .flatMap(msg => msg.tags || [])
      .filter(Boolean);
    
    const tagCounts = allTags.reduce((counts, tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
      return counts;
    }, {});
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
  };
  
  const topTags = getTopTags();
  
  return (
    <div className="mt-2">
      {/* Summary with improved styling */}
      <div className="text-sm text-slate-200 leading-relaxed bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
        {summary}
      </div>
      
      {/* Show top 5 most common tags */}
      {topTags.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-slate-400 font-medium">Top tags:</span>
          {topTags.map((tag, idx) => (
            <Badge 
              key={idx} 
              variant="secondary" 
              className="text-xs bg-slate-700/60 text-slate-200 border-slate-600/50 hover:bg-slate-600/60 cursor-pointer transition-colors"
              onClick={(e) => {
                onTagClick(tag, conversationId, e);
              }}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const HighlightCode = ({ content }) => {
  const safeContent = safeRenderContent(content);
  
  // Enhanced formatting for image descriptions with greenish theme colors
  const formatImageContent = (text) => {
    // First, try to extract and format raw JSON metadata
    let processedText = text;
    
    // Handle raw JSON objects that show prompt/size information
    const jsonPattern = /\{\s*"prompt":\s*"([^"]+)"[^}]*"size":\s*"([^"]+)"[^}]*\}/g;
    processedText = processedText.replace(jsonPattern, (match, prompt, size) => {
      return `\n\n[Image Generated: ${prompt} (${size})]`;
    });
    
    // Handle cases where we have separate prompt and size mentions
    if (processedText.includes('"prompt":') && processedText.includes('"size":')) {
      const promptMatch = processedText.match(/"prompt":\s*"([^"]+)"/);
      const sizeMatch = processedText.match(/"size":\s*"([^"]+)"/);
      if (promptMatch && sizeMatch) {
        processedText = `\n\n[Image Generated: ${promptMatch[1]} (${sizeMatch[1]})]`;
      }
    }
    
    // Format image generation descriptions with greenish theme
    return processedText.replace(/\[Image Generated: (.+?)\]/g, (match, description) => {
      return `<div class="flex items-center gap-2 px-3 py-2 bg-emerald-900/40 border border-emerald-600/50 rounded-lg my-3 max-w-full">
        <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <span class="text-emerald-200 font-medium flex-shrink-0">Image Generated:</span>
        <span class="text-emerald-100 break-words">${description}</span>
      </div>`;
    })
    // Format basic image placeholders with greenish theme
    .replace(/\[Image\]/g, 
      `<div class="flex items-center gap-2 px-3 py-2 bg-emerald-900/40 border border-emerald-600/50 rounded-lg my-3">
        <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <span class="text-emerald-200 font-medium">Image</span>
      </div>`)
    // Format voice content placeholders
    .replace(/\[Voice\/Audio Content\]/g, 
      `<div class="flex items-center gap-2 px-3 py-2 bg-amber-900/40 border border-amber-600/50 rounded-lg my-3">
        <svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
        </svg>
        <span class="text-amber-200 font-medium">Voice/Audio Content</span>
      </div>`)
    // Remove transcript tags from content since they now appear next to message ID
    .replace(/\[Transcript\]/g, '')
    // Format document placeholders
    .replace(/\[Document\/File\]/g, 
      `<div class="flex items-center gap-2 px-3 py-2 bg-slate-700/40 border border-slate-600/50 rounded-lg my-3">
        <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span class="text-slate-300 font-medium">Document/File</span>
      </div>`);
  };
  
  const parts = safeContent.split(/(```[\s\S]*?```)/);
  
  return (
    <div className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          return (
            <span key={index} className="inline-block w-full">
              <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 border-purple-500/50 mb-2">
                <Code className="h-3 w-3 mr-1" />
                Code Block
              </Badge>
              <pre className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{part.slice(3, -3)}</code>
              </pre>
            </span>
          );
        }
        
        // Apply image and media formatting to non-code parts
        const formattedPart = formatImageContent(part);
        
        return (
          <span 
            key={index} 
            dangerouslySetInnerHTML={{ __html: formattedPart }}
          />
        );
      })}
    </div>
  );
};

// Enhanced wrapper component to handle content detection and highlighting for messages
const MessageContent = ({ content, isImage }) => {
  // Function to highlight placeholder content
  const highlightPlaceholderContent = (text) => {
    if (typeof text !== 'string') return text;
    
    // Replace placeholder content with highlighted versions
    return text
      .replace(/\[Unknown Content\]/g, 
        '<span class="inline-block px-2 py-1 bg-amber-900/60 border border-amber-600/70 text-amber-300 font-semibold rounded text-sm">[Unknown Content]</span>')
      .replace(/\[Voice\/Audio Content\]/g, 
        '<span class="inline-block px-2 py-1 bg-amber-900/60 border border-amber-600/70 text-amber-300 font-semibold rounded text-sm">[Voice/Audio Content]</span>')
      .replace(/\[Image Content\]/g, 
        '<span class="inline-block px-2 py-1 bg-emerald-900/60 border border-emerald-600/70 text-emerald-300 font-semibold rounded text-sm">[Image Content]</span>')
      .replace(/\[Image\]/g, 
        '<span class="inline-block px-2 py-1 bg-emerald-900/60 border border-emerald-600/70 text-emerald-300 font-semibold rounded text-sm">[Image]</span>');
  };

  // If this is an image message but doesn't have any formatted tags, add a fallback
  if (isImage && typeof content === 'string' && 
      !content.includes('[Image') && 
      !content.includes('[Voice') && 
      !content.includes('[Document') &&
      content.trim() !== '') {
    
    // Check if it's raw JSON metadata that we should format
    if (content.includes('"prompt":') || content.includes('"size":') || 
        content.includes('1024x1024') || content.includes('512x512')) {
      return <HighlightCode content={content} />;
    }
    
    // Otherwise, add a generic image placeholder and show the content
    const contentWithPlaceholder = `[Image]\n\n${content}`;
    const highlightedContent = highlightPlaceholderContent(contentWithPlaceholder);
    return <div dangerouslySetInnerHTML={{ __html: highlightedContent }} className="whitespace-pre-wrap break-words" />;
  }
  
  // Apply highlighting to any placeholder content
  if (typeof content === 'string' && 
      (content.includes('[Unknown Content]') || 
       content.includes('[Voice/Audio Content]') || 
       content.includes('[Image Content]') || 
       content.includes('[Image]'))) {
    const highlightedContent = highlightPlaceholderContent(content);
    return <div dangerouslySetInnerHTML={{ __html: highlightedContent }} className="whitespace-pre-wrap break-words" />;
  }
  
  return <HighlightCode content={content} />;
};

// Enhanced component for enriched content with improved styling
const EnrichedContent = ({ content, namedEntities }) => {
  const safeContent = safeRenderContent(content);
  
  if (typeof safeContent !== 'string') {
    return <div className="whitespace-pre-wrap text-sm text-slate-300 bg-slate-800/30 p-3 rounded border border-slate-700/50">{JSON.stringify(safeContent, null, 2)}</div>;
  }

  // Function to highlight placeholder content
  const highlightPlaceholderContent = (text) => {
    if (typeof text !== 'string') return text;
    
    // Replace placeholder content with highlighted versions
    return text
      .replace(/\[Unknown Content\]/g, 
        '<span class="inline-block px-2 py-1 bg-amber-900/60 border border-amber-600/70 text-amber-300 font-semibold rounded text-sm">[Unknown Content]</span>')
      .replace(/\[Voice\/Audio Content\]/g, 
        '<span class="inline-block px-2 py-1 bg-amber-900/60 border border-amber-600/70 text-amber-300 font-semibold rounded text-sm">[Voice/Audio Content]</span>')
      .replace(/\[Image Content\]/g, 
        '<span class="inline-block px-2 py-1 bg-emerald-900/60 border border-emerald-600/70 text-emerald-300 font-semibold rounded text-sm">[Image Content]</span>')
      .replace(/\[Image\]/g, 
        '<span class="inline-block px-2 py-1 bg-emerald-900/60 border border-emerald-600/70 text-emerald-300 font-semibold rounded text-sm">[Image]</span>');
  };

  const parts = safeContent.split(/(```[\s\S]*?```)/g);

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          return (
            <span key={index} className="bg-purple-900/50 border border-purple-600/50 p-2 rounded-sm block my-2">
              {part}
            </span>
          );
        }
        // Apply NER highlighting first, then placeholder highlighting
        let highlighted = highlightNEREntities(part, namedEntities);
        highlighted = highlightPlaceholderContent(highlighted);
        return <span key={index} dangerouslySetInnerHTML={{ __html: highlighted }} />;
      })}
    </div>
  );
};

// Enhanced Enrichment Section Component
const EnrichmentSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    isLoading,
    currentStage,
    preprocessedData,
    enrichedFiles,
    includeSelection,
    config,
    selectedModel,
    setSelectedModel,
    setConfig,
    handleEnrichStream,
    handleSelectEnrichedFile,
    selectedEnrichedFile,
  } = useImport();

  const handleEnrichClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    } else {
      // Actually start enrichment
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
    }
  };

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
                  {key === 'gpt-4o-mini' && (
                    <span className="text-xs px-1 py-0.5 rounded text-white bg-emerald-500">
                      RECOMMENDED
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={handleEnrichClick} 
          disabled={includeSelection.size === 0} 
          className="h-8 px-4 text-xs bg-green-600 hover:bg-green-700"
        >
          {isExpanded ? (
            <>
              <Sparkles className="w-3 h-3 mr-1" />
              Start Enrichment
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              Configure & Enrich
            </>
          )}
        </Button>
      </div>

      {/* Expanded Options - Only When Expanded */}
      {isExpanded && (
        <div className="space-y-1.5 pt-1.5 border-t border-gray-700">
          {/* Scope Selection */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 w-12">Scope:</span>
            <div className="flex items-center gap-3">
              <Button
                variant={config.enrichmentScope === 'conversations-10' ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setConfig(prev => ({ ...prev, enrichmentScope: 'conversations-10' }))}
              >
                First 10
              </Button>
              <Button
                variant={config.enrichmentScope === 'conversations--1' ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setConfig(prev => ({ ...prev, enrichmentScope: 'conversations--1' }))}
              >
                All
              </Button>
            </div>
          </div>

          {/* AI Options */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Checkbox 
                id="ai-topics" 
                checked={config.generateTopics}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, generateTopics: Boolean(checked) }))}
                className="h-3 w-3"
              />
              <label htmlFor="ai-topics" className="text-gray-300">AI Topics</label>
            </div>
            <div className="flex items-center gap-1">
              <Checkbox 
                id="ner" 
                checked={config.enableNER}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableNER: Boolean(checked) }))}
                className="h-3 w-3"
              />
              <label htmlFor="ner" className="text-gray-300">NER</label>
            </div>
            <div className="flex items-center gap-1">
              <Checkbox 
                id="user-only" 
                checked={config.nerUserOnly}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, nerUserOnly: Boolean(checked) }))}
                className="h-3 w-3"
              />
              <label htmlFor="user-only" className="text-gray-300">User only</label>
            </div>
          </div>

          {/* Enriched Files Selection */}
          {enrichedFiles.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 w-12">Files:</span>
              <Select value={selectedEnrichedFile || ''} onValueChange={handleSelectEnrichedFile}>
                <SelectTrigger className="h-6 text-xs bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select enriched file" />
                </SelectTrigger>
                <SelectContent>
                  {enrichedFiles.map(f => (
                    <SelectItem key={f} value={f}>
                      {new Date(parseInt(f.match(/\d+/)[0])).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DataPreview = () => {
  const [tagMessageIndex, setTagMessageIndex] = useState({});
  const [openAccordion, setOpenAccordion] = useState('');
  const messageRefs = useRef({});
  
  const {
    preprocessedData,
    dataToLoad,
    enrichmentErrors,
    enrichSelection,
    includeSelection,
    userOnlySelection,
    config,
    setConfig,
    handleEnrichSelect,
    handleIncludeSelect,
    handleSelectAllEnrich,
    handleSelectAllInclude,
    handleUserOnlySelect,
    saveAndApplyPreprocessing,
  } = useImport();
  
  const conversations = dataToLoad || preprocessedData;
  const failedMessageIds = new Map(enrichmentErrors.map(e => [e.message_id, e.reason]));
  const isEnrichedData = !!dataToLoad;

  // Function to handle tag clicks
  const handleTagClick = (tag, conversationId, event) => {
    // debug removed
    
    // Ensure event is properly stopped
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      // stopImmediatePropagation might not be available on all event objects
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
      // debug removed
    }
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation || !conversation.messages) {
      // debug removed
      return;
    }

    let messagesWithTag;

    // Handle content detection tags differently
    if (tag === 'code') {
      messagesWithTag = conversation.messages
        .map((msg, index) => ({ msg, index }))
        .filter(({ msg }) => {
          const content = safeRenderContent(msg.content);
          const hasCode = /```/.test(content) || (typeof content === 'string' && content.includes('[Code Block Removed]'));
          // debug removed
          return hasCode;
        });
    } else if (tag === 'image') {
      messagesWithTag = conversation.messages
        .map((msg, index) => ({ msg, index }))
        .filter(({ msg }) => {
          const hasImage = msg.isImage || (typeof msg.content === 'string' && (
            msg.content.includes('[Image Generated:') || 
            msg.content.includes('[Image]') || 
            msg.content.includes('[Image Content]') ||
            msg.content.includes('"prompt":') || 
            msg.content.includes('"size":') || 
            msg.content.includes('1024x1024') ||
            msg.content.includes('512x512')
          ));
          // debug removed
          return hasImage;
        });
    } else if (tag === 'voice') {
      // Only target voice messages that are missing transcript data (problematic voice messages)
      messagesWithTag = conversation.messages
        .map((msg, index) => ({ msg, index }))
        .filter(({ msg }) => {
          // Check if this is a voice message with missing or problematic content
          const hasProblematicVoiceContent = msg.isVoice && (typeof msg.content === 'string' && (
            msg.content.includes('[Voice/Audio Content]') ||
            msg.content.includes('[Unknown Content]') ||
            msg.content.trim() === '' ||
            msg.content.trim() === '[Voice/Audio Content]'
          ));
          // debug removed
          return hasProblematicVoiceContent;
        });
    } else {
      // Handle enriched tags (AI-generated tags)
      messagesWithTag = conversation.messages
        .map((msg, index) => ({ msg, index }))
        .filter(({ msg }) => msg.tags && msg.tags.includes(tag));
    }

    // debug removed
    
    if (messagesWithTag.length === 0) {
      // debug removed
      
      // Show white glow on the conversation row to indicate no messages found
      const conversationRow = document.querySelector(`[data-conversation-id="${conversationId}"]`);
      if (conversationRow) {
        // debug removed
        conversationRow.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
        conversationRow.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        conversationRow.style.borderWidth = '2px';
        
        setTimeout(() => {
          conversationRow.style.boxShadow = '';
          conversationRow.style.borderColor = '';
          conversationRow.style.borderWidth = '';
        }, 2000);
      }
      
      return;
    }

    // Get current index for this tag, starting at -1 so first click goes to index 0
    const tagKey = `${conversationId}-${tag}`;
    const currentIndex = tagMessageIndex[tagKey] !== undefined ? tagMessageIndex[tagKey] : -1;
    const nextIndex = messagesWithTag.length > 0 ? (currentIndex + 1) % messagesWithTag.length : 0;
    
    // Check if we're on the last message (about to cycle back to first on next click)
    const isLastMessage = messagesWithTag.length > 1 && nextIndex === messagesWithTag.length - 1;

    // debug removed

    // Update the index for this tag
    setTagMessageIndex(prev => ({
      ...prev,
      [tagKey]: nextIndex
    }));

    // Force accordion to open
    // debug removed
    setOpenAccordion(conversationId);

    // Get the message to scroll to
    const targetMessage = messagesWithTag[nextIndex];
    const messageId = targetMessage.msg.id;
    
    // debug removed

    // Scroll to the message after a minimal delay to ensure accordion is open
    setTimeout(() => {
      const messageElement = messageRefs.current[messageId];
      // debug removed
      
      if (messageElement) {
        // Find the scrollable container
        const messagesContainer = messageElement.closest('.messages-scroll-container');
        // debug removed
        
        if (messagesContainer) {
          // Very short delay for accordion to expand
          setTimeout(() => {
            // Get the relative position of the message within the scroll container
            const containerRect = messagesContainer.getBoundingClientRect();
            const messageRect = messageElement.getBoundingClientRect();
            
            // Calculate the message's position relative to the container's current scroll position
            const messageTopRelativeToContainer = messageRect.top - containerRect.top + messagesContainer.scrollTop;
            const messageHeight = messageElement.clientHeight;
            const containerHeight = messagesContainer.clientHeight;
            
            // Calculate scroll position to put the message near the top with adaptive padding
            // Use very conservative padding for messages at the top to avoid scrolling past them
            const desiredPadding = 40; // Desired padding from top
            const availablePadding = messageTopRelativeToContainer; // How much space is available above the message
            
            // Be extra conservative for early messages
            let topPadding;
            if (messageTopRelativeToContainer < 120) {
              // If message is within 120px of top, use very minimal padding
              topPadding = Math.max(0, Math.min(10, availablePadding / 2));
            } else if (messageTopRelativeToContainer < 200) {
              // If message is within 200px of top, use reduced padding
              topPadding = Math.max(0, Math.min(25, availablePadding - 15));
            } else {
              // For messages further down, use normal adaptive padding
              topPadding = Math.min(desiredPadding, Math.max(0, availablePadding - 10));
            }
            
            // Prefer scrolling the nearest messages container so the conversation header remains visible
            const messagesContainer = messageElement.closest('.messages-scroll-container') as HTMLElement | null;
            if (messagesContainer) {
              const containerRect = messagesContainer.getBoundingClientRect();
              const messageRect = messageElement.getBoundingClientRect();
              const messageTopRelativeToContainer = messageRect.top - containerRect.top + messagesContainer.scrollTop;
              const topPadding = 12;
              const scrollTop = Math.max(0, messageTopRelativeToContainer - topPadding);
              messagesContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
            } else {
              messageElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }
          }, 50); // Fast response for accordion expansion
        } else {
          // Fallback: try scrollIntoView
          // debug removed
          messageElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }
        
        // Add a temporary highlight effect - white glow if this is the last message
        if (isLastMessage) {
          messageElement.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
          messageElement.style.borderColor = 'rgba(255, 255, 255, 0.8)';
          // debug removed
        } else {
          messageElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8)';
          messageElement.style.borderColor = 'rgba(59, 130, 246, 0.8)';
          // debug removed
        }
        messageElement.style.borderWidth = '2px';
        
        setTimeout(() => {
          messageElement.style.boxShadow = '';
          messageElement.style.borderColor = '';
          messageElement.style.borderWidth = '';
        }, 3000);
      } else {
        // debug removed
      }
    }, 200); // Fast initial delay for accordion opening
  };

  // Helper function to detect voice conversations with missing/problematic content
  const isProblematicVoiceConversation = (convo) => {
    // Check if any voice messages have missing or problematic content
    const hasProblematicVoiceMessages = convo.messages?.some(msg => {
      if (!msg.isVoice) return false;
      
      if (typeof msg.content === 'string') {
        return msg.content.includes('[Voice/Audio Content]') ||
               msg.content.includes('[Unknown Content]') ||
               msg.content.trim() === ''; // Only truly empty content
      }
      return true; // Non-string content is problematic
    });
    
    return hasProblematicVoiceMessages;
  };

  // Helper function to detect image conversations with missing/problematic content
  const isProblematicImageConversation = (convo) => {
    // Check if any image messages have missing or problematic content
    const hasProblematicImageMessages = convo.messages?.some(msg => {
      if (!msg.isImage) return false;
      
      if (typeof msg.content === 'string') {
        return msg.content.includes('[Image]') ||
               msg.content.includes('[Image Content]') ||
               msg.content.includes('[Unknown Content]') ||
               msg.content.trim() === ''; // Only truly empty content
      }
      return true; // Non-string content is problematic
    });
    
    return hasProblematicImageMessages;
  };

  if (!conversations || conversations.length === 0) return null;
  
  const allEnrichSelected = enrichSelection.size > 0 && enrichSelection.size === conversations.length;
  const allIncludeSelected = includeSelection.size > 0 && includeSelection.size === conversations.length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        {/* Split Header: Step 2 & Step 3 Side by Side */}
        {!isEnrichedData ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Step 2: Prepare Data */}
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/50 flex items-center justify-center text-sm font-bold">2</div>
                    Prepare Data
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Select conversations and apply preprocessing options.
                    {(!config.showAI || !config.showUser) && (
                      <span className="text-yellow-400 ml-2">
                        Filtering: {!config.showUser && 'No User'}{(!config.showUser && !config.showAI) && ', '}{!config.showAI && 'No AI'}
                      </span>
                    )}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-sm text-slate-300">
                    <span className="font-medium text-sky-400">{includeSelection.size}</span> of <span className="font-medium">{preprocessedData.length}</span> selected
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

              {/* Preprocessing Controls - Compact */}
              <div className="space-y-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                {/* Presets Row */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 font-medium min-w-[50px]">Presets:</span>
                  <div className="flex gap-1">
                    <Button 
                      onClick={() => setConfig(prev => ({ ...prev, showUser: true, showAI: true, removeCodeBlocks: false, filterSinceLastImport: false }))}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs px-2"
                    >
                      Full
                    </Button>
                    <Button 
                      onClick={() => setConfig(prev => ({ ...prev, showUser: true, showAI: true, removeCodeBlocks: true, filterSinceLastImport: false }))}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs px-2"
                    >
                      Clean
                    </Button>
                    <Button 
                      onClick={() => setConfig(prev => ({ ...prev, showUser: false, showAI: true, removeCodeBlocks: true, filterSinceLastImport: false }))}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs px-2"
                    >
                      AI-Only
                    </Button>
                  </div>
                </div>
                
                {/* Filters & Options Row */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="showUser" 
                        checked={config.showUser} 
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showUser: Boolean(checked) }))} 
                      />
                      <Label htmlFor="showUser" className="text-xs">User</Label>
                      <Checkbox 
                        id="showAI" 
                        checked={config.showAI} 
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showAI: Boolean(checked) }))} 
                      />
                      <Label htmlFor="showAI" className="text-xs">AI</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="remove-code-blocks" 
                        checked={config.removeCodeBlocks} 
                        onCheckedChange={(checked) => setConfig(prev => ({...prev, removeCodeBlocks: Boolean(checked)}))} 
                      />
                      <Label htmlFor="remove-code-blocks" className="text-xs">Remove Code</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="select-all-include"
                        checked={allIncludeSelected}
                        onCheckedChange={(checked) => handleSelectAllInclude(Boolean(checked))}
                      />
                      <Label htmlFor="select-all-include" className="text-xs">Include All</Label>
                      <Checkbox 
                        id="select-all-enrich"
                        checked={allEnrichSelected}
                        onCheckedChange={(checked) => handleSelectAllEnrich(Boolean(checked))}
                      />
                      <Label htmlFor="select-all-enrich" className="text-xs">Enrich All</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="filterSinceLastImport" 
                        checked={config.filterSinceLastImport} 
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, filterSinceLastImport: Boolean(checked) }))} 
                      />
                      <Label htmlFor="filterSinceLastImport" className="text-xs">Since last import</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: AI Enrichment - Now in Header */}
            <div className="space-y-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-sm font-bold">3</div>
                  AI Enrichment
                </CardTitle>
                <CardDescription className="mt-1">
                  Generate tags, summaries, and embeddings with AI processing.
                </CardDescription>
              </div>

              {/* Always Visible Token Usage */}
              <div className="p-3 bg-emerald-900/20 border border-emerald-600/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-emerald-200">Token Usage Estimate</span>
                </div>
                <EnrichmentSection isHeaderMode={true} />
              </div>
            </div>
          </div>
        ) : (
          /* Enriched Data Header */
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                Enriched Data Preview
              </CardTitle>
              <CardDescription>
                <span className="text-emerald-400">
                  Showing AI-enriched conversations with tags, summaries, and highlighted entities
                </span>
              </CardDescription>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
          {conversations.map((convo) => (
            <AccordionItem value={convo.id} key={convo.id}>
              {/* Make the entire row a clickable trigger with separate interactive areas */}
              <div 
                className="flex items-center w-full border-b border-slate-700/50 hover:border-slate-600/70 transition-colors cursor-pointer hover:bg-slate-800/20"
                data-conversation-id={convo.id}
                onClick={() => {
                  // Toggle accordion when clicking anywhere on the row
                  setOpenAccordion(openAccordion === convo.id ? '' : convo.id);
                }}
              >
                {/* Only show checkboxes for non-enriched data */}
                {!isEnrichedData && (
                  <div 
                    className="flex items-center space-x-3 p-4 bg-slate-800/30 border-r border-slate-700/50"
                    onClick={(e) => e.stopPropagation()} // Prevent row click when interacting with checkboxes
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
                )}
                
                {/* Main content area - now just a div, not AccordionTrigger */}
                <div className={cn(
                  "flex-1 text-left py-6 px-6 transition-all duration-200",
                  !isEnrichedData ? "" : "pl-6",
                  "group w-full min-w-0"
                )}>
                  <div className="flex flex-1 items-center justify-between w-full min-w-0">
                    <div className="flex flex-col flex-1 pr-6 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-slate-100 text-base group-hover:text-white transition-colors">
                          {convo.title || convo.topic || 'Untitled Conversation'}
                        </span>
                        
                        {/* Content Detection Badges */}
                        <div className="flex items-center gap-2">
                          {/* Voice conversation badge */}
                          {(isProblematicVoiceConversation(convo) || convo.hasVoiceContent) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                console.log('🏷️ Voice badge clicked');
                                e.preventDefault();
                                e.stopPropagation();
                                handleTagClick('voice', convo.id, e);
                              }}
                              className="transition-all duration-200 hover:scale-105 hover:shadow-lg rounded-md"
                            >
                              <Badge variant="secondary" className="bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30 hover:border-amber-400/60 cursor-pointer transition-all">
                                <Mic className="h-3 w-3 mr-1.5" />
                                Voice
                              </Badge>
                            </button>
                          )}
                          
                          {/* Image conversation badge */}
                          {(isProblematicImageConversation(convo) || convo.hasImageContent) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                console.log('🏷️ Image badge clicked');
                                e.preventDefault();
                                e.stopPropagation();
                                handleTagClick('image', convo.id, e);
                              }}
                              className="transition-all duration-200 hover:scale-105 hover:shadow-lg rounded-md"
                            >
                              <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30 hover:border-emerald-400/60 cursor-pointer transition-all">
                                <Image className="h-3 w-3 mr-1.5" />
                                Image
                              </Badge>
                            </button>
                          )}
                          
                          {/* Code conversation badge - moved from right column */}
                          {!isEnrichedData && convo.hasCode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                console.log('🏷️ Code badge clicked');
                                e.preventDefault();
                                e.stopPropagation();
                                handleTagClick('code', convo.id, e);
                              }}
                              className="transition-all duration-200 hover:scale-105 hover:shadow-lg rounded-md"
                            >
                              <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30 hover:border-purple-400/60 cursor-pointer transition-all">
                                <Code className="h-3 w-3 mr-1.5" />
                                Code
                              </Badge>
                            </button>
                          )}
                          
                          {/* Enriched badges */}
                          {isEnrichedData && (
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-300 border-emerald-500/40">
                                <Sparkles className="h-3 w-3 mr-1.5" />
                                Enriched
                              </Badge>
                              {hasNEREntities(convo) && (
                                <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/40">
                                  <Eye className="h-3 w-3 mr-1.5" />
                                  NER
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Show summary for enriched data that wraps naturally */}
                      {isEnrichedData && convo.summary && (
                        <ConversationSummary 
                          summary={convo.summary} 
                          messages={convo.messages} 
                          onTagClick={handleTagClick} 
                          conversationId={convo.id} 
                        />
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          {convo.create_time ? new Date(convo.create_time * 1000).toLocaleDateString() : 'No date'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {convo.messages?.length || 0} messages
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      {/* Expand indicator */}
                      <div className="flex items-center text-slate-500 group-hover:text-slate-400 transition-colors">
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          openAccordion === convo.id && "rotate-180"
                        )} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags positioned outside main content - separate clickable area */}
                {isEnrichedData && convo.tags && convo.tags.length > 0 && (
                  <div 
                    className="flex items-center gap-2 px-4 py-3 bg-slate-800/30 border-l border-slate-700/50 min-w-[200px]"
                    onClick={(e) => {
                      console.log('🏷️ Tags container clicked');
                      e.stopPropagation();
                    }}
                  >
                    <Tag className="h-3 w-3 text-blue-400 flex-shrink-0" />
                    <div className="text-xs text-blue-300 flex items-center gap-1 flex-wrap">
                      {convo.tags.slice(0, 3).map((tag, idx) => (
                        <React.Fragment key={idx}>
                          <button
                            type="button"
                            onClick={(e) => {
                              console.log('🏷️ Tag button clicked:', tag);
                              e.preventDefault();
                              e.stopPropagation();
                              handleTagClick(tag, convo.id, e);
                            }}
                            className="hover:underline hover:text-blue-200 cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-blue-800/30"
                          >
                            {tag}
                          </button>
                          {idx < Math.min(2, convo.tags.length - 1) && <span className="text-slate-500">,</span>}
                        </React.Fragment>
                      ))}
                      {convo.tags.length > 3 && <span className="text-slate-500">...</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Keep the AccordionTrigger but make it hidden - just for the accordion functionality */}
              <AccordionTrigger className="hidden" />
              
              <AccordionContent>
                {/* Show conversation-level enrichment info */}
                {isEnrichedData && (
                  <div className="mb-4 p-4 bg-slate-800/60 rounded-lg border border-slate-700/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tags */}
                      {convo.tags && convo.tags.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-2">
                            <Tag className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-300">Conversation Tags</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {convo.tags.map((tag, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="text-xs bg-blue-600/30 text-blue-200 border-blue-500/60 hover:bg-blue-600/50 cursor-pointer transition-colors"
                                onClick={(e) => {
                                  handleTagClick(tag, convo.id, e);
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Named Entities */}
                      {hasNEREntities(convo) && (
                        <div>
                          <div className="flex items-center gap-1 mb-2">
                            <Brain className="h-4 w-4 text-purple-400" />
                            <span className="text-sm font-medium text-purple-300">Named Entities</span>
                          </div>
                          <div className="space-y-1">
                            {Object.entries(convo.named_entities).map(([type, entities]) => 
                              Array.isArray(entities) && entities.length > 0 && (
                                <div key={type} className="text-xs">
                                  <span className="text-slate-400 font-medium">{type}:</span>
                                  <span className="ml-2 text-slate-200">{entities.slice(0, 3).join(', ')}{entities.length > 3 ? '...' : ''}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="max-h-96 overflow-y-auto pr-4 messages-scroll-container">
                  <TooltipProvider>
                    {convo.messages?.map((msg, index) => {
                      const isFailed = failedMessageIds.has(msg.id);
                      const failureReason = failedMessageIds.get(msg.id);
                      
                      // Enhanced content detection for message ID highlighting - only highlight problematic content
                      const hasCodeContent = /```/.test(safeRenderContent(msg.content)) || 
                                           (typeof msg.content === 'string' && msg.content.includes('[Code Block Removed]'));
                      
                      // Only highlight voice content when it's missing or problematic
                      const hasProblematicVoiceContent = msg.isVoice && (typeof msg.content === 'string' && (
                        msg.content.includes('[Voice/Audio Content]') ||
                        msg.content.includes('[Unknown Content]') ||
                        msg.content.trim() === '' ||
                        msg.content.trim() === '[Voice/Audio Content]'
                      ));
                      
                      // Detect if this message has a transcript (voice with actual text content)
                      const hasTranscript = msg.isVoice && (typeof msg.content === 'string' && (
                        msg.content.includes('[Transcript]') ||
                        (msg.content.trim() !== '' && 
                         msg.content.length > 10 &&
                         !msg.content.includes('[Voice/Audio Content]') && 
                         !msg.content.includes('[Unknown Content]') &&
                         msg.content.trim() !== '[Voice/Audio Content]')
                      ));
                      
                      // Highlight image content - both with visible placeholders AND when marked as image but no visible content
                      const hasImageContent = msg.isImage || (typeof msg.content === 'string' && (
                        msg.content.includes('[Image Generated:') || 
                        msg.content.includes('[Image]') || 
                        msg.content.includes('[Image Content]') ||
                        msg.content.includes('[Unknown Content]') ||
                        msg.content.includes('"prompt":') || 
                        msg.content.includes('"size":') || 
                        msg.content.includes('"revised_prompt":') ||
                        msg.content.includes('1024x1024') ||
                        msg.content.includes('512x512')
                      ));

                      return (
                        <div 
                          key={msg.id || index} 
                          ref={el => messageRefs.current[msg.id] = el}
                          className={cn(
                            "p-4 my-3 rounded-lg relative border transition-all duration-300 scroll-mt-12",
                            msg.author === 'user' || msg.role === 'user' ? 'bg-blue-950/60 border-blue-800/60' : 'bg-cyan-950/60 border-cyan-700/60',
                            isFailed && "border-red-500/80 border-2"
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "font-semibold capitalize text-sm",
                                (msg.author === 'user' || msg.role === 'user') ? 'text-blue-300' : 'text-cyan-300'
                              )}>{msg.author || msg.role}</p>
                              
                              {isFailed && (
                                <Badge variant="destructive" className="bg-red-600/80 text-white">Failed</Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Message tags */}
                              {isEnrichedData && msg.tags && msg.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {msg.tags.slice(0, 3).map((tag, tagIdx) => (
                                    <Badge 
                                      key={tagIdx} 
                                      variant="outline" 
                                      className="text-xs bg-slate-700/60 text-slate-200 border-slate-600/50 hover:bg-slate-600/60 cursor-pointer transition-colors"
                                      onClick={(e) => {
                                        handleTagClick(tag, convo.id, e);
                                      }}
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {msg.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs bg-slate-700/60 text-slate-200 border-slate-600/50">
                                      +{msg.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              {/* Enhanced Message ID with distinctive highlighting */}
                              <span className={cn(
                                "text-xs font-mono px-2 py-1 rounded border",
                                // Code content highlighting - purple/violet (highest priority)
                                hasCodeContent && "bg-purple-900/60 border-purple-600/70 text-purple-300 font-semibold",
                                // Transcript highlighting - amber with lighter styling (voice with actual content)
                                hasTranscript && !hasCodeContent && "bg-amber-800/50 border-amber-500/60 text-amber-200 font-semibold",
                                // Voice content highlighting - amber with darker styling (voice but no/missing content)
                                hasProblematicVoiceContent && !hasCodeContent && !hasTranscript && "bg-amber-900/70 border-amber-600/80 text-amber-300 font-semibold shadow-amber-500/20 shadow-sm",
                                // Image content highlighting - emerald to match theme
                                hasImageContent && !hasCodeContent && !hasProblematicVoiceContent && !hasTranscript && "bg-emerald-900/60 border-emerald-600/70 text-emerald-300 font-semibold shadow-emerald-500/20 shadow-sm",
                                // Default styling for regular messages
                                !hasCodeContent && !hasProblematicVoiceContent && !hasImageContent && !hasTranscript && "text-slate-400 border-slate-600/30"
                              )}>
                                {msg.id}
                              </span>
                              
                              {/* Show transcript tag next to message ID */}
                              {hasTranscript && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-800/40 border border-amber-500/60 rounded text-xs ml-2">
                                  <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                                  </svg>
                                  <span className="text-amber-200 font-medium">Transcript</span>
                                </span>
                              )}
                              
                              {/* Show voice content tag for problematic voice messages */}
                              {hasProblematicVoiceContent && !hasTranscript && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-900/50 border border-amber-600/70 rounded text-xs ml-2">
                                  <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                                  </svg>
                                  <span className="text-amber-300 font-medium">Voice Data</span>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Use enhanced content component for enriched data */}
                          {isEnrichedData ? (
                            <EnrichedContent content={msg.content} namedEntities={msg.named_entities} />
                          ) : (
                            <MessageContent content={msg.content} isImage={msg.isImage} />
                          )}
                        </div>
                      )
                    })}
                  </TooltipProvider>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}; 