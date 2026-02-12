// Helper function to safely render content
export const safeRenderContent = (content: any): string => {
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content !== null) {
    return JSON.stringify(content, null, 2);
  }
  return String(content);
};

// Enhanced formatting for image descriptions with greenish theme colors
export const formatImageContent = (text: string): string => {
  if (!text) return '';
  
  // Check if it's an image generation request/response
  if (text.toLowerCase().includes('image generation') || text.toLowerCase().includes('generated image')) {
    return `<div class="p-2 rounded bg-indigo-900/30 border border-indigo-600/50 text-indigo-200">
      ${text}
    </div>`;
  }
  
  return text;
};

// Enhanced content formatting with code block detection and image/media formatting
export const formatContent = (content: any, isImage?: boolean): string => {
  const text = safeRenderContent(content);
  
  if (isImage) {
    return formatImageContent(text);
  }
  
  return text;
};

// Helper function to detect if content has code blocks
export const hasCodeBlocks = (content: any): boolean => {
  if (!content) return false;
  const text = safeRenderContent(content);
  
  // Check for code block markers
  return text.includes('```') || 
         text.includes('`') ||
         text.includes('function') ||
         text.includes('class') ||
         text.includes('const') ||
         text.includes('let') ||
         text.includes('var');
};

// Helper function to detect if content has images
export const hasImages = (content: any): boolean => {
  if (!content) return false;
  const text = safeRenderContent(content).toLowerCase();
  
  return text.includes('![') || 
         text.includes('.png') ||
         text.includes('.jpg') ||
         text.includes('.jpeg') ||
         text.includes('.gif') ||
         text.includes('image generation') ||
         text.includes('generated image');
};

// Helper function to detect if content has voice/audio
export const hasVoiceAudio = (content: any): boolean => {
  if (!content) return false;
  const text = safeRenderContent(content).toLowerCase();
  
  return text.includes('voice message') ||
         text.includes('audio message') ||
         text.includes('voice transcript') ||
         text.includes('transcript:') ||
         text.includes('.mp3') ||
         text.includes('.wav') ||
         text.includes('.ogg');
}; 