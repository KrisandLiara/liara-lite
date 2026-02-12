import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Hash, MessageSquare } from 'lucide-react';
import { 
  MODEL_PRICING, 
  calculateTokensForEnrichment, 
  calculateCostForModel, 
  formatCurrency, 
  formatTime 
} from '@/lib/import/tokenEstimator';
import { liaraClasses } from '@/lib/theme/liara-theme';

interface TokenCostEstimatorProps {
  conversations: Array<{ messages: Array<{ content: string }> }>;
  className?: string;
}

export const TokenCostEstimator: React.FC<TokenCostEstimatorProps> = ({ 
  conversations, 
  className = '' 
}) => {
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');

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

  const modelOptions = Object.entries(MODEL_PRICING).map(([key, model]) => ({
    value: key,
    label: model.name
  }));

  if (conversations.length === 0) {
    return (
      <Card className={`opacity-40 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Cost Estimation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Select conversations to see cost estimates
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${liaraClasses.card} ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-medium flex items-center gap-2 ${liaraClasses.textSecondary}`}>
          <DollarSign className="h-4 w-4 text-emerald-400" />
          Cost Estimation
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Model Selection */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Model</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <MessageSquare className={`h-3 w-3 ${liaraClasses.textMuted}`} />
              <span className={`text-xs ${liaraClasses.textMuted}`}>Conversations</span>
            </div>
            <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-200 h-5">
              {tokenEstimate.conversationCount.toLocaleString()}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Hash className={`h-3 w-3 ${liaraClasses.textMuted}`} />
              <span className={`text-xs ${liaraClasses.textMuted}`}>Messages</span>
            </div>
            <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-200 h-5">
              {tokenEstimate.messageCount.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Token Estimate */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Estimated Tokens</span>
            <Badge variant="outline" className="text-xs font-mono h-5">
              {tokenEstimate.totalTokens.toLocaleString()}
            </Badge>
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Input:</span>
              <span className="font-mono">{tokenEstimate.totalInputTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Output (est.):</span>
              <span className="font-mono">{tokenEstimate.estimatedOutputTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Cost & Time Estimate */}
        <div className="border-t border-slate-700 pt-2 space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">Estimated Cost</span>
            </div>
            <Badge className="bg-emerald-900 text-emerald-300 hover:bg-emerald-900 border-emerald-500 h-5 text-xs">
              {formatCurrency(costEstimate.totalCost)}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Clock className={`h-3 w-3 ${liaraClasses.textAccent}`} />
              <span className={`text-xs font-medium ${liaraClasses.textAccent}`}>Estimated Time</span>
            </div>
            <Badge variant="outline" className="text-sky-300 border-sky-500 bg-sky-900 h-5 text-xs">
              {formatTime(costEstimate.estimatedTime)}
            </Badge>
          </div>
        </div>

        {/* Breakdown */}
        <div className="text-xs text-slate-500 space-y-0.5 pt-1 border-t border-slate-700">
          <div className="flex justify-between">
            <span>Input cost:</span>
            <span className="font-mono">{formatCurrency(costEstimate.inputCost)}</span>
          </div>
          <div className="flex justify-between">
            <span>Output cost:</span>
            <span className="font-mono">{formatCurrency(costEstimate.outputCost)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 