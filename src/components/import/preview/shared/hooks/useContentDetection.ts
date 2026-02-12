import { useMemo } from 'react';
import { findCodeBlocks, filterRenderableBlocks } from '@/lib/import/codeDetection';

// Shared, simple in-memory cache for detection to avoid repeated heavy regex work per render.
// Keyed by message id and a short hash of its content string.
const detectionCache = new Map<string, { hasRenderableCode: boolean; blocksLen: number }>();

function hashContent(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

interface ContentTypes {
  hasVoiceContent: boolean;
  hasImages: boolean;
  hasCode: boolean;
  hasProblematicVoice: boolean;
  hasProblematicImages: boolean;
  hasImageGeneration: boolean;
  hasMixedContent: boolean;
}

interface MessageTypeIndicators {
  hasCode: boolean;
  hasImage: boolean;
  hasVoice: boolean;
  hasTranscript: boolean;
  isProblematicVoice: boolean;
  isProblematicImage: boolean;
  isImageGeneration: boolean;
  isMixedContent: boolean;
}

// Helper function to safely render content
const safeRenderContent = (content: any): string | null => {
  if (typeof content === 'string') {
    return content;
  }
  if (typeof content === 'object' && content !== null) {
    return JSON.stringify(content);
  }
  return null;
};

// Lightweight detector used ONLY to count code-heavy conversations.
// It is intentionally more permissive than visual tagging but still avoids prose.
const hasCodeForThreshold = (text: string | null): boolean => {
  if (typeof text !== 'string' || text.trim().length === 0) return false;
  // Fenced blocks
  if (/```/.test(text)) return true;
  // Real stack traces
  if (/\bat\s+[^\n]+\((?:.*\.(?:js|ts):\d+:\d+)\)/.test(text)) return true;
  // Error prefixes
  if (/(?:Error|TypeError|ReferenceError|SyntaxError|AxiosError):/.test(text)) return true;
  // JSON-ish objects with multiple fields
  const colonCount = (text.match(/:/g) || []).length;
  if (colonCount >= 2 && /[\{\[]/.test(text) && /[\}\]]/.test(text)) return true;
  // Imports / require
  if (/require\(['"]/i.test(text) || /\bimport\s+[^\n]+from\b/i.test(text)) return true;
  // Keywords + function call combo
  const kwCount = (text.match(/\b(const|let|var|function|class|import|export|return|try|catch)\b/gi) || []).length;
  const hasCall = /\b\w+\s*\([^)]*\)/.test(text);
  if (kwCount >= 2 && hasCall) return true;
  return false;
};

// Visual tagging: only count blocks that would actually render as code in UI
const hasRenderableCode = (text: string, aggressive: boolean, cacheKey?: string): boolean => {
  if (cacheKey && detectionCache.has(cacheKey)) {
    return detectionCache.get(cacheKey)!.hasRenderableCode;
  }
  const blocks = findCodeBlocks(text, aggressive);
  if (!blocks || blocks.length === 0) {
    if (cacheKey) detectionCache.set(cacheKey, { hasRenderableCode: false, blocksLen: 0 });
    return false;
  }
  const filtered = filterRenderableBlocks(text, blocks);
  const result = filtered.length > 0;
  if (cacheKey) detectionCache.set(cacheKey, { hasRenderableCode: result, blocksLen: filtered.length });
  return result;
};

// Shared content detection functions
export const isVoiceContent = (msg: any): boolean => {
  // Check message flags and metadata
  if (msg.isVoice || msg.type === 'voice' ||
      (msg.metadata && (msg.metadata.voice_mode_message || msg.metadata.is_voice_message))) {
    return true;
  }

  // Check content
  const content = msg.content;
  if (!content) return false;

  // Check string content
  if (typeof content === 'string') {
    return content.includes('[Voice/Audio Content]') ||
           content.includes('[Transcript]');
  }

  return false;
};
// Track code block count per conversation
const conversationCodeCounts = new Map<string, number>();

export const isCodeContent = (msg: any): boolean => {
  // Only check actual content that would be processed by code removal
  const content = msg.content;
  if (!content) return false;

  // Voice (and transcript) always take precedence over code. Never tag voice as code.
  if (isVoiceContent(msg)) {
    return false;
  }

  // Image (including image-generation) always takes precedence over code tagging.
  if (isImageContent(msg) || Boolean(msg?.metadata?.image_generation)) {
    return false;
  }

  // Convert object content to string
  const text = safeRenderContent(content);
  if (typeof text !== 'string') return false;

  const isUserMessage = msg.author === 'user' || msg.role === 'user';
  const conversationId = msg.conversationId || msg.conversation_id;

  // Update conversation code count lazily using the lightweight threshold detector
  if (conversationId && !conversationCodeCounts.has(conversationId)) {
    const conversation = msg.conversation || { messages: [] };
    const codeCount = conversation.messages?.reduce((count: number, m: any) => {
      const mText = safeRenderContent(m.content);
      return count + (hasCodeForThreshold(mText) ? 1 : 0);
    }, 0) || 0;

    conversationCodeCounts.set(conversationId, codeCount);
  }

  // Check if this is a code-heavy conversation
  const isCodeHeavy = (conversationCodeCounts.get(conversationId) || 0) >= 20;

  // For user messages, check for common patterns like "I have this error" followed by code
  if (isUserMessage) {
    const lines = text.split('\n');
    const contextPattern = /^(?:I have|I get|Getting|Here's|This is|Error:|Got)\s+(?:this|the|an?|some)\s+(?:error|code|output|message|warning)/i;
    
    // If we find such a pattern, consider everything after it as code
    const contextLineIndex = lines.findIndex(line => contextPattern.test(line));
    if (contextLineIndex !== -1) {
      // Create a modified version of the text that preserves the context
      const preservedContext = lines[contextLineIndex];
      const remainingText = lines.slice(contextLineIndex + 1).join('\n');
      const blocks = findCodeBlocks(remainingText, true);
      
      if (blocks.length > 0) {
        return true;
      }
    }
  }

  // Use findCodeBlocks with aggressive mode in code-heavy conversations
  const cacheKey = msg.id ? `${msg.id}:${hashContent(text)}` : undefined;
  const blocks = findCodeBlocks(text, isCodeHeavy);

  // No special media fallback needed because images/voice already short-circuit above

  // Debug logging to show exactly what would be removed
  // debug removed

  // Only tag if there are blocks that would actually render as code
  return hasRenderableCode(text, isCodeHeavy, cacheKey);
};
export const isImageContent = (msg: any): boolean => {
  // Check metadata flags first
  if (msg.isImage || 
      (msg.metadata && (
        msg.metadata.is_image ||
        msg.metadata.type === 'image' ||
        msg.metadata.message_type === 'image'
      ))) {
    return true;
  }

  // Check content for image indicators
  const content = msg.content;
  if (typeof content === 'string') {
    // Check for JSON prompt format
    if (content.includes('"prompt":')) {
      try {
        const jsonContent = JSON.parse(content.trim());
        if (jsonContent.prompt) {
          return true;
        }
      } catch (e) {
        // JSON parsing failed, continue with other checks
      }
    }

    // Check for plain text AI image format (Prompt: and Model: fields)
    if (content.includes('Prompt:') && content.includes('Model:')) {
      return true;
    }

    // Check for image markers
    return content.includes('[Image]') || 
           content.includes('[Image Generated:') ||
           content.includes('AI Generated Image');
  }

  return false;
};

export const useContentDetection = () => {
  // Helper function to detect image generation from metadata or content
  const isImageGenerationContent = (obj: any): boolean => {
    if (!obj) return false;
    
    // Only check metadata flags
    return Boolean(
      obj.metadata?.image_generation ||
      obj.metadata?.type === 'image_generation' ||
      obj.metadata?.message_type === 'image_generation'
    );
  };

  // Helper function to detect code content from metadata or content
  const detectCodeInObject = (obj: any): boolean => {
    if (!obj) return false;

    // Only check actual content that would be processed by code removal
    const content = obj.content;
    if (!content) return false;

    // Convert object content to string
    const text = safeRenderContent(content);
    if (typeof text !== 'string') return false;

    // Use findCodeBlocks to match removal script
    const blocks = findCodeBlocks(text);
    return blocks.length > 0;
  };

  // Helper function to try parsing JSON string
  const tryParseJSON = (str: string) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  };

  const detectContentTypes = (conversation: any): ContentTypes => {
    // Initialize all flags to false
    let hasVoiceContent = Boolean(conversation.hasVoiceContent);
    let hasImages = false;
    let hasCode = false;
    let hasProblematicVoice = false;
    let hasProblematicImages = false;
    let hasImageGeneration = false;
    let hasMixedContent = false;

    // Check messages
    const messages = conversation.messages || [];
    messages.forEach((msg: any) => {
      // Voice content
      if (msg.isVoice || (msg.metadata && msg.metadata.is_voice_message)) {
        hasVoiceContent = true;
        // Consider voice problematic if no content
        if (!msg.content) {
          hasProblematicVoice = true;
        }
      }

      // Image content - use shared detection
      if (isImageContent(msg)) {
        hasImages = true;
        // Consider image problematic if no content
        if (!msg.content) {
          hasProblematicImages = true;
        }
      }

      // Image generation - only check metadata
      if (msg.metadata && (
        msg.metadata.image_generation ||
        msg.metadata.type === 'image_generation' ||
        msg.metadata.message_type === 'image_generation'
      )) {
        hasImageGeneration = true;
        hasImages = true;
      }

      // Code content - use unified detection
      if (isCodeContent(msg)) {
        hasCode = true;
      }
    });

    return {
      hasVoiceContent,
      hasImages,
      hasCode,
      hasProblematicVoice,
      hasProblematicImages,
      hasImageGeneration,
      hasMixedContent
    };
  };

  const getMessageTypeIndicators = (message: any): MessageTypeIndicators => {
    // Initialize flags using unified detection functions
    const placeholderOnly = typeof message.content === 'string' && /\[(?:Inline Code|[A-Z]+\s+Block|Code Block)\]/.test(message.content);
    let hasCode = placeholderOnly ? false : isCodeContent(message);
    let hasImage = isImageContent(message);
    let hasVoice = isVoiceContent(message);
    let hasTranscript = Boolean(message.metadata?.has_transcript);
    let isProblematicVoice = hasVoice && !message.content;
    let isProblematicImage = hasImage && !message.content;
    let isImageGeneration = Boolean(
      message.metadata?.image_generation ||
      message.metadata?.type === 'image_generation' ||
      message.metadata?.message_type === 'image_generation'
    );
    let isMixedContent = false;

    return {
      hasCode,
      hasImage,
      hasVoice,
      hasTranscript,
      isProblematicVoice,
      isProblematicImage,
      isImageGeneration,
      isMixedContent
    };
  };

  const isProblematicVoiceConversation = (conversation: any): boolean => {
    const { hasVoiceContent, hasProblematicVoice } = detectContentTypes(conversation);
    return hasVoiceContent && hasProblematicVoice;
  };

  const isProblematicImageConversation = (conversation: any): boolean => {
    const { hasImages, hasProblematicImages } = detectContentTypes(conversation);
    return hasImages && hasProblematicImages;
  };

  return {
    detectContentTypes,
    getMessageTypeIndicators,
    isProblematicVoiceConversation,
    isProblematicImageConversation,
    isImageGenerationContent,
  };
};

//comment another comment 