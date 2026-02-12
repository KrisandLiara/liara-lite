export interface ModelPricing {
  name: string;
  inputTokensPerDollar: number;
  outputTokensPerDollar: number;
  estimatedTimePerMessage: number; // seconds
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    inputTokensPerDollar: 100000, // $0.01 per 1K tokens
    outputTokensPerDollar: 33333, // $0.03 per 1K tokens
    estimatedTimePerMessage: 3
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    inputTokensPerDollar: 500000, // $0.002 per 1K tokens
    outputTokensPerDollar: 500000, // $0.002 per 1K tokens
    estimatedTimePerMessage: 1.5
  },
  'gpt-4o': {
    name: 'GPT-4o',
    inputTokensPerDollar: 200000, // $0.005 per 1K tokens
    outputTokensPerDollar: 66667, // $0.015 per 1K tokens
    estimatedTimePerMessage: 2
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    inputTokensPerDollar: 6666667, // $0.00015 per 1K tokens
    outputTokensPerDollar: 1666667, // $0.0006 per 1K tokens
    estimatedTimePerMessage: 1
  }
};

// Rough token estimation based on character count
// This is a simplified approximation - real tokenization would be more accurate
export function estimateTokensFromText(text: string): number {
  // Average of ~4 characters per token for English text
  // Adding some buffer for formatting, JSON structure, etc.
  return Math.ceil(text.length / 3.5);
}

export function estimateTokensForMessage(content: string): number {
  // Base tokens for message structure (role, metadata, etc.)
  const baseTokens = 10;
  const contentTokens = estimateTokensFromText(content);
  return baseTokens + contentTokens;
}

export function estimateTokensForConversation(messages: Array<{ content: string }>): number {
  // Base tokens for conversation structure
  const baseTokens = 20;
  const messageTokens = messages.reduce((sum, msg) => sum + estimateTokensForMessage(msg.content), 0);
  return baseTokens + messageTokens;
}

export interface TokenEstimate {
  totalInputTokens: number;
  estimatedOutputTokens: number;
  totalTokens: number;
  conversationCount: number;
  messageCount: number;
}

export function calculateTokensForEnrichment(
  conversations: Array<{ messages: Array<{ content: string; role?: string }> }>, 
  options: { enableNER?: boolean; nerUserOnly?: boolean } = {}
): TokenEstimate {
  const conversationCount = conversations.length;
  const messageCount = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
  
  const totalInputTokens = conversations.reduce((sum, conv) => 
    sum + estimateTokensForConversation(conv.messages), 0
  );
  
  // Estimate output tokens based on enrichment operations:
  // - Summary: ~50-100 tokens per conversation
  // - Tags: ~20-30 tokens per message (processed individually)
  // - NER: ~30-50 tokens per message when enabled
  // - Embeddings: no additional text tokens (just processing)
  
  let estimatedOutputTokens = conversationCount * 75; // Summary per conversation
  estimatedOutputTokens += messageCount * 25; // Tags per message
  
  // Add NER tokens if enabled
  if (options.enableNER) {
    if (options.nerUserOnly) {
      // Estimate ~50% of messages are user messages
      const userMessageCount = Math.ceil(messageCount * 0.5);
      estimatedOutputTokens += userMessageCount * 40; // NER per user message
    } else {
      estimatedOutputTokens += messageCount * 40; // NER per message
    }
  }
  
  return {
    totalInputTokens,
    estimatedOutputTokens,
    totalTokens: totalInputTokens + estimatedOutputTokens,
    conversationCount,
    messageCount
  };
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  estimatedTime: number; // in minutes
}

export function calculateCostForModel(
  tokens: TokenEstimate, 
  modelKey: string, 
  options: { enableNER?: boolean; nerUserOnly?: boolean } = {}
): CostEstimate {
  const model = MODEL_PRICING[modelKey];
  if (!model) {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  const inputCost = tokens.totalInputTokens / model.inputTokensPerDollar;
  const outputCost = tokens.estimatedOutputTokens / model.outputTokensPerDollar;
  const totalCost = inputCost + outputCost;
  
  // Base time calculation
  let estimatedTime = (tokens.messageCount * model.estimatedTimePerMessage) / 60; // Convert to minutes
  
  // Add extra time for NER processing if enabled
  if (options.enableNER) {
    // NER adds approximately 0.5 seconds per message processed
    const nerTimePerMessage = 0.5; // seconds
    if (options.nerUserOnly) {
      // Estimate ~50% of messages are user messages
      const userMessageCount = Math.ceil(tokens.messageCount * 0.5);
      estimatedTime += (userMessageCount * nerTimePerMessage) / 60; // Convert to minutes
    } else {
      estimatedTime += (tokens.messageCount * nerTimePerMessage) / 60; // Convert to minutes
    }
  }

  return {
    inputCost,
    outputCost,
    totalCost,
    estimatedTime
  };
}

export function formatCurrency(amount: number): string {
  if (amount < 0.01) {
    return `<$0.01`;
  }
  return `$${amount.toFixed(2)}`;
}

export function formatTime(minutes: number): string {
  if (minutes < 1) {
    return `${Math.ceil(minutes * 60)}s`;
  } else if (minutes < 60) {
    return `${Math.ceil(minutes)}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.ceil(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  }
} 