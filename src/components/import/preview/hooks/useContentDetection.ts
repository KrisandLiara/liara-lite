import { useMemo } from 'react';

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

export const useContentDetection = () => {
  // Helper function to detect image generation content
  const isImageGenerationContent = (content: any): boolean => {
    if (typeof content !== 'object') return false;
    
    // Check for image generation metadata
    if (content.type === 'image' && content.metadata) {
      return Boolean(
        content.metadata.prompt ||
        content.metadata.model?.toLowerCase().includes('dall-e') ||
        content.metadata.model?.toLowerCase().includes('stable-diffusion') ||
        content.metadata.model?.toLowerCase().includes('midjourney') ||
        content.metadata.size?.match(/^\d+x\d+$/) ||
        content.metadata.style ||
        content.metadata.negative_prompt
      );
    }
    
    // Check for image generation in text
    if (typeof content === 'string') {
      const text = content.toLowerCase();
      return Boolean(
        text.match(/generate.*image|create.*image|dall-e|stable.*diffusion|midjourney/i) ||
        text.match(/"prompt":\s*"[^"]+"|"size":\s*"\d+x\d+"|"style":\s*"[^"]+"/i) ||
        text.includes('image generation') ||
        text.includes('generated image') ||
        text.includes('ai image') ||
        text.includes('artificial intelligence image')
      );
    }

    return false;
  };

  // Helper function to detect mixed content
  const hasMixedContentTypes = (content: any): boolean => {
    if (typeof content !== 'object') return false;

    // Count different content types
    let types = new Set();
    if (content.text || content.transcript) types.add('text');
    if (content.type === 'voice' || content.transcript || content.audio || content.isVoice) types.add('voice');
    if (content.type === 'image' || content.url?.match(/\.(png|jpe?g|gif|webp|svg)$/i) || content.isImage) types.add('image');
    if (content.type === 'code' || content.language || content.code) types.add('code');

    return types.size > 1;
  };

  // Helper function to detect actual code blocks
  const hasCodeBlock = (text: string): boolean => {
    // Look for fenced code blocks with language specification
    if (text.match(/```[a-z]+[\s\S]*?```/)) return true;
    
    // Look for code blocks with specific language markers
    if (text.match(/```(javascript|typescript|python|java|cpp|c\+\+|ruby|go|rust|php|html|css|sql)[\s\S]*?```/i)) return true;
    
    // Look for HTML/XML-like content
    if (text.match(/<\/?[a-z][\s\S]*?>/i) && text.includes('</')) return true;
    
    return false;
  };

  const detectContentTypes = (conversation: any): ContentTypes => {
    const messages = conversation.messages || [];
    let hasVoiceContent = false;
    let hasImages = false;
    let hasCode = false;
    let hasProblematicVoice = false;
    let hasProblematicImages = false;
    let hasImageGeneration = false;
    let hasMixedContent = false;

    messages.forEach((msg: any) => {
      // Check message flags first
      if (msg.isVoice) {
        hasVoiceContent = true;
        if (!msg.content || typeof msg.content === 'string' && msg.content.trim() === '[Voice/Audio Content]') {
          hasProblematicVoice = true;
        }
      }

      if (msg.isImage) {
        hasImages = true;
        if (!msg.content || typeof msg.content === 'string' && msg.content.trim() === '[Image]') {
          hasProblematicImages = true;
        }
      }

      const content = msg.content;
      
      // Check for voice content
      if (typeof content === 'object') {
        if (content.type === 'voice' || content.transcript || content.audio) {
          hasVoiceContent = true;
          if (!content.text && !content.transcript) {
            hasProblematicVoice = true;
          }
        }

        // Check for image content
        if (content.type === 'image' || content.url?.match(/\.(png|jpe?g|gif|webp|svg)$/i)) {
          hasImages = true;
          if (!content.url && !content.data) {
            hasProblematicImages = true;
          }
          // Check for image generation
          if (isImageGenerationContent(content)) {
            hasImageGeneration = true;
          }
        }

        // Check for code content
        if (content.type === 'code' || content.language || content.code) {
          hasCode = true;
        }
      } else if (typeof content === 'string') {
        // Check for code blocks
        if (hasCodeBlock(content)) {
          hasCode = true;
        }
        // Check for image generation text
        if (isImageGenerationContent(content)) {
          hasImageGeneration = true;
          hasImages = true;
        }
        // Check for voice/image placeholders
        if (content.includes('[Voice/Audio Content]')) {
          hasVoiceContent = true;
          hasProblematicVoice = true;
        }
        if (content.includes('[Image]')) {
          hasImages = true;
          hasProblematicImages = true;
        }
      }

      // Check for mixed content
      if (hasMixedContentTypes(content)) {
        hasMixedContent = true;
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
    // Check message flags first
    let hasCode = false;
    let hasImage = message.isImage || false;
    let hasVoice = message.isVoice || false;
    let hasTranscript = false;
    let isProblematicVoice = false;
    let isProblematicImage = false;
    let isImageGeneration = false;
    let isMixedContent = false;

    const content = message.content;

    if (typeof content === 'object') {
      // Voice content
      if (content.type === 'voice' || content.transcript || content.audio) {
        hasVoice = true;
        hasTranscript = Boolean(content.text || content.transcript);
        isProblematicVoice = !hasTranscript;
      }
      // Image content
      if (content.type === 'image' || content.url?.match(/\.(png|jpe?g|gif|webp|svg)$/i)) {
        hasImage = true;
        isProblematicImage = !content.url && !content.data;
        isImageGeneration = isImageGenerationContent(content);
      }
      // Code content
      if (content.type === 'code' || content.language || content.code) {
        hasCode = true;
      }
      isMixedContent = hasMixedContentTypes(content);
    } else if (typeof content === 'string') {
      // Code blocks
      hasCode = hasCodeBlock(content);
      // Image generation text
      isImageGeneration = isImageGenerationContent(content);
      hasImage = hasImage || isImageGeneration;
      // Check for voice/image placeholders
      if (content.includes('[Voice/Audio Content]')) {
        hasVoice = true;
        isProblematicVoice = true;
      }
      if (content.includes('[Image]')) {
        hasImage = true;
        isProblematicImage = true;
      }
    }

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
    hasMixedContentTypes
  };
}; 