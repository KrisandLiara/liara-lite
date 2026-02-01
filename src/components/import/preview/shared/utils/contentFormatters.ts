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
  const hasCodeMarkers = text.includes('```') || text.includes('`');
  
  // Check for common programming keywords
  const hasKeywords = [
    'function',
    'class',
    'const',
    'let',
    'var',
    'import',
    'export',
    'return',
    'interface',
    'type',
    'public',
    'private',
    'protected',
    'async',
    'await',
    'try',
    'catch',
    'if',
    'else',
    'for',
    'while',
    'switch',
    'case'
  ].some(keyword => {
    // Match whole words only
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(text);
  });

  // Check for common file extensions
  const hasFileExtensions = [
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.py',
    '.java',
    '.cpp',
    '.cs',
    '.go',
    '.rb',
    '.php'
  ].some(ext => text.toLowerCase().includes(ext));

  return hasCodeMarkers || hasKeywords || hasFileExtensions;
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
         text.includes('generated image') ||
         text.includes('dall-e') ||
         text.includes('midjourney') ||
         text.includes('stable diffusion');
};

// Helper function to detect if content has voice/audio
export const hasVoiceAudio = (content: any): boolean => {
  if (!content) return false;
  const text = safeRenderContent(content).toLowerCase();
  
  // Check for voice/audio related terms
  const hasVoiceTerms = [
    'voice message',
    'audio message',
    'voice transcript',
    'transcript:',
    'voice note',
    'audio note',
    'voice recording',
    'audio recording',
    'recorded message',
    'speech to text',
    'voice clip',
    'audio clip',
    'spoken message',
    'dictated message'
  ].some(term => text.includes(term));

  // Check for audio file extensions
  const hasAudioExtensions = [
    '.mp3',
    '.wav',
    '.ogg',
    '.m4a',
    '.aac',
    '.flac',
    '.wma',
    '.aiff'
  ].some(ext => text.includes(ext));

  // Check for voice commands/indicators
  const hasVoiceIndicators = [
    'speaking:',
    'says:',
    'spoke:',
    'recorded:',
    'transcribed:',
    'transcription:',
    'voice input:',
    'audio input:'
  ].some(indicator => text.includes(indicator));

  return hasVoiceTerms || hasAudioExtensions || hasVoiceIndicators;
};