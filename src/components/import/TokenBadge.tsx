import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock } from 'lucide-react';
import { 
  MODEL_PRICING,
  calculateTokensForEnrichment, 
  calculateCostForModel, 
  formatCurrency, 
  formatTime 
} from '@/lib/import/tokenEstimator';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TokenBadgeProps {
  conversations: Array<{ messages: Array<{ content: string }> }>;
}

export const TokenBadge: React.FC<TokenBadgeProps> = ({ conversations }) => {
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');

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
    return calculateTokensForEnrichment(conversations);
  }, [conversations]);

  const costEstimate = useMemo(() => {
    if (tokenEstimate.totalTokens === 0) {
      return {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        estimatedTime: 0
      };
    }
    return calculateCostForModel(tokenEstimate, selectedModel);
  }, [tokenEstimate, selectedModel]);

  if (conversations.length === 0) {
    return (
      <Badge variant="outline" className="text-slate-500 border-slate-600">
        No data selected
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          className="bg-emerald-900 text-emerald-300 hover:bg-emerald-800 border-emerald-500 cursor-pointer transition-colors"
        >
          <DollarSign className="w-3 h-3 mr-1" />
          {formatCurrency(costEstimate.totalCost)}
          <Clock className="w-3 h-3 ml-2 mr-1" />
          {formatTime(costEstimate.estimatedTime)}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-slate-800 border-slate-700" align="end">
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-200">Cost Breakdown</div>
          
          {/* Model Selection */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-7 text-xs bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {modelOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value} 
                    className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-slate-400">Conversations:</div>
            <div className="text-slate-200">{tokenEstimate.conversationCount}</div>
            
            <div className="text-slate-400">Messages:</div>
            <div className="text-slate-200">{tokenEstimate.messageCount}</div>
            
            <div className="text-slate-400">Total Tokens:</div>
            <div className="text-slate-200 font-mono">{tokenEstimate.totalTokens.toLocaleString()}</div>
          </div>
          
          <div className="border-t border-slate-700 pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Input cost:</span>
              <span className="text-slate-200 font-mono">{formatCurrency(costEstimate.inputCost)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Output cost:</span>
              <span className="text-slate-200 font-mono">{formatCurrency(costEstimate.outputCost)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-emerald-400">Total:</span>
              <span className="text-emerald-300">{formatCurrency(costEstimate.totalCost)}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}; 