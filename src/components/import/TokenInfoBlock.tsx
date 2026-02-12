import React, { useState, useMemo } from 'react';
import { DollarSign, Clock, Users, MessageSquare, Info } from 'lucide-react';
import { 
  MODEL_PRICING,
  calculateTokensForEnrichment, 
  calculateCostForModel, 
  formatCurrency, 
  formatTime 
} from '@/lib/import/tokenEstimator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface TokenInfoBlockProps {
  conversations: Array<{ messages: Array<{ content: string; role?: string }> }>;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  enableNER?: boolean;
  nerUserOnly?: boolean;
  compact?: boolean;
}

export const TokenInfoBlock: React.FC<TokenInfoBlockProps> = ({ 
  conversations, 
  selectedModel: externalSelectedModel,
  onModelChange,
  enableNER = false,
  nerUserOnly = false,
  compact = false
}) => {
  const [internalSelectedModel, setInternalSelectedModel] = useState('gpt-4o-mini');
  
  const selectedModel = externalSelectedModel || internalSelectedModel;
  
  const handleModelChange = (model: string) => {
    if (onModelChange) {
      onModelChange(model);
    } else {
      setInternalSelectedModel(model);
    }
  };

  const modelOptions = Object.entries(MODEL_PRICING).map(([key, model]) => ({
    value: key,
    label: model.name
  }));

  const tokenEstimate = useMemo(() => {
    if (conversations.length === 0) {
      return {
        totalInputTokens: 0,
        estimatedOutputTokens: 0,
        totalTokens: 0,
        conversationCount: 0,
        messageCount: 0
      };
    }
    return calculateTokensForEnrichment(conversations, { enableNER, nerUserOnly });
  }, [conversations, enableNER, nerUserOnly]);

  const costEstimate = useMemo(() => {
    if (tokenEstimate.totalTokens === 0) {
      return {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        estimatedTime: 0
      };
    }
    return calculateCostForModel(tokenEstimate, selectedModel, { enableNER, nerUserOnly });
  }, [tokenEstimate, selectedModel, enableNER, nerUserOnly]);

  const getModelRecommendation = (modelKey: string) => {
    const recommendations = {
      'gpt-4o-mini': {
        badge: 'RECOMMENDED',
        badgeColor: 'bg-emerald-500',
        description: 'Best balance of cost and quality',
        useCase: 'Most imports, general use'
      },
      'gpt-3.5-turbo': {
        badge: 'BUDGET',
        badgeColor: 'bg-blue-500',
        description: 'Lowest cost option',
        useCase: 'Large datasets, cost-sensitive'
      },
      'gpt-4o': {
        badge: 'QUALITY',
        badgeColor: 'bg-purple-500',
        description: 'Higher quality summaries',
        useCase: 'Important conversations'
      },
      'gpt-4-turbo': {
        badge: 'PREMIUM',
        badgeColor: 'bg-orange-500',
        description: 'Best quality, highest cost',
        useCase: 'Critical analysis, complex content'
      }
    };
    return recommendations[modelKey] || null;
  };

  if (conversations.length === 0) {
    return (
      <div className="text-xs text-slate-500 text-center py-4">
        No data selected
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-2"}>
      {/* Model Selection */}
      <div className={compact ? "space-y-1" : "space-y-1"}>
        <label className="text-xs font-medium text-slate-400">Model</label>
        <Select value={selectedModel} onValueChange={handleModelChange}>
          <SelectTrigger className={compact ? "h-7 text-xs" : "h-7 text-xs bg-slate-700 border-slate-600"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {modelOptions.map((option) => {
              const rec = getModelRecommendation(option.value);
              return (
                <SelectItem 
                  key={option.value} 
                  value={option.value} 
                  className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                >
                  <div className="flex items-center gap-2">
                    {option.label}
                    {rec && (
                      <span className={`text-xs px-1 py-0.5 rounded text-white ${rec.badgeColor}`}>
                        {rec.badge}
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      
      {/* Stats Grid */}
      <div className={compact ? "grid grid-cols-2 gap-2 text-xs" : "grid grid-cols-2 gap-2 text-xs"}>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-slate-400" />
          <span className="text-slate-400">{compact ? "Convos:" : "Conversations:"}</span>
        </div>
        <div className="text-slate-200 font-medium">{tokenEstimate.conversationCount}</div>
        
        <div className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-slate-400" />
          <span className="text-slate-400">{compact ? "Msgs:" : "Messages:"}</span>
        </div>
        <div className="text-slate-200 font-medium">{tokenEstimate.messageCount}</div>
        
        <div className="text-slate-400">{compact ? "Tokens:" : "Total Tokens:"}</div>
        <div className="text-slate-200 font-mono font-medium">{tokenEstimate.totalTokens.toLocaleString()}</div>
      </div>
      
      {/* Cost Summary */}
      <div className="border-t border-slate-700 pt-2 space-y-1">
        {!compact && (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Input cost:</span>
              <span className="text-slate-200 font-mono">{formatCurrency(costEstimate.inputCost)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Output cost:</span>
              <span className="text-slate-200 font-mono">{formatCurrency(costEstimate.outputCost)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-sm font-medium">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400">Total:</span>
          </div>
          <span className="text-emerald-300">{formatCurrency(costEstimate.totalCost)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-400" />
            <span className="text-sky-400">Est. Time:</span>
          </div>
          <span className="text-sky-300">{formatTime(costEstimate.estimatedTime)}</span>
        </div>
      </div>
      
      {/* Model Recommendations - Hide in compact mode */}
      {!compact && (
        <div className="border-t border-slate-700 pt-2">
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors w-full">
              <Info className="w-3 h-3" />
              Model Comparison & Recommendations
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {Object.entries(MODEL_PRICING).map(([key, model]) => {
                const rec = getModelRecommendation(key);
                const isSelected = key === selectedModel;
                return (
                  <div 
                    key={key} 
                    className={`p-2 rounded-lg border text-xs ${
                      isSelected 
                        ? 'bg-slate-700/50 border-sky-500/50' 
                        : 'bg-slate-800/30 border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{model.name}</span>
                        {rec && (
                          <span className={`text-xs px-1 py-0.5 rounded text-white ${rec.badgeColor}`}>
                            {rec.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400">
                        ${(1000 / model.inputTokensPerDollar).toFixed(4)}/1K tokens
                      </div>
                    </div>
                    {rec && (
                      <div className="space-y-0.5">
                        <p className="text-slate-300">{rec.description}</p>
                        <p className="text-slate-400">
                          <span className="font-medium">Best for:</span> {rec.useCase}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}; 