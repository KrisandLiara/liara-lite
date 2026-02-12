// Content components
export { MessageContent } from './content/MessageContent';

// Feature components
export { TagHighlighting } from './features/TagHighlighting';
export { ScrollToFeature } from './features/ScrollToFeature';
export { CodeHighlighting } from './features/CodeHighlighting';
export { ImagePreview } from './features/ImagePreview';
export { VoicePreview } from './features/VoicePreview';

// Hooks
export { useTagHighlight } from './hooks/useTagHighlight';
export { useContentDetection, isImageContent, isCodeContent, isVoiceContent } from './hooks/useContentDetection';

// Utils
export { 
  safeRenderContent,
  formatImageContent,
  formatContent,
  hasCodeBlocks,
  hasImages,
  hasVoiceAudio
} from './utils/contentFormatters';

export {
  getTopTags,
  processTagsForHighlighting,
  countTags,
  getAllTags,
  hasTag,
  filterMessagesByTag,
  formatTags
} from './utils/tagUtils';

// Card components
export { CardWrapper, CardHeaderWrapper, CardContentWrapper } from './CardWrapper';

// File selector
export { UnifiedFileSelector as FileSelector } from './FileSelector'; 