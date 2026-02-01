/**
 * Safely extracts content from message parts, handling both strings and objects
 * @param {any[]} parts The parts array from ChatGPT message content
 * @returns {string} The extracted text content
 */
function extractContentFromParts(parts) {
  if (!Array.isArray(parts)) return '';
  
  const processedParts = parts.map(part => {
    if (typeof part === 'string') {
      return part;
    } else if (typeof part === 'object' && part !== null) {
      // Handle ChatGPT voice transcription format
      if (part.content_type === 'audio_transcription' && part.text) {
        // debug removed
        // Add transcript tag to indicate this is transcribed content
        return part.text.trim() + '\n\n[Transcript]';
      }
      
      // Handle ChatGPT audio asset pointers (skip - we only want the transcript)
      if (part.content_type === 'audio_asset_pointer' || part.audio_asset_pointer) {
        // debug removed
        return '';
      }
      
      // Handle other real-time audio/video content (skip - we only want the transcript)
      if (part.content_type === 'real_time_user_audio_video_asset_pointer') {
        // debug removed
        return '';
      }
      
      // Handle legacy formats
      if (part.text) {
        return part.text;
      } else if (part.transcript) {
        // debug removed
        return part.transcript;
      } else if (part.content) {
        return part.content;
      } 
      // Image generation and content detection
      else if (part.type === 'image' || 
               part.content_type === 'image' || 
               part.image_url ||
               part.prompt || 
               part.size || 
               part.revised_prompt) {
        
        // Create a new object for metadata
        let metadata = { ...part };
        
        // Extract description for generated images
        if (part.prompt || part.size || part.revised_prompt) {
          // debug removed
          const description = part.revised_prompt || part.prompt || 'image';
          const size = part.size ? ` (${part.size})` : '';
          
          // Only show image tag if we have a meaningful description
          if (description && description !== 'image' && description.length > 5) {
            return `\n\n[Image Generated: ${description}${size}]`;
          }
        } else {
          // debug removed
        }
        
        return '\n\n[Image]';
      }
      // File/document detection
      else if (part.type === 'file' || part.content_type === 'file' || part.document) {
        return '\n\n[Document/File]';
      } 
      // Legacy voice/audio detection
      else if (part.type === 'voice' || part.type === 'audio' || part.transcript !== undefined || part.audio !== undefined) {
        // debug removed
        
        // If we have a transcript, show it with a small tag
        if (part.transcript && part.transcript.trim()) {
          return `${part.transcript}\n\n[Transcript]`;
        }
        
        // If no transcript, show voice placeholder
        return '\n\n[Voice/Audio Content]';
      } else {
        // For other complex objects, try to identify the type
        // debug removed
        
        // Create a new object for metadata
        let metadata = { ...part };
        
        // Check for any voice-related properties more broadly
        const voiceIndicators = ['transcript', 'audio', 'voice', 'speech', 'recording'];
        const imageIndicators = ['image', 'picture', 'photo', 'prompt', 'size', 'revised_prompt', 'dalle', 'image_url'];
        
        const hasVoiceProperty = Object.keys(part).some(key => 
          voiceIndicators.some(indicator => key.toLowerCase().includes(indicator))
        );
        
        const hasImageProperty = Object.keys(part).some(key => 
          imageIndicators.some(indicator => key.toLowerCase().includes(indicator))
        );
        
        // Prioritize image detection over voice detection
        if (hasImageProperty) {
          // debug removed
          // Try to extract description from image-related properties
          const description = part.revised_prompt || part.prompt || part.description || 'image';
          const size = part.size ? ` (${part.size})` : '';
          
          if (description && description !== 'image' && description.length > 5) {
            return `\n\n[Image Generated: ${description}${size}]`;
          } else {
            return '\n\n[Image]';
          }
        }
        
        if (hasVoiceProperty) {
          // debug removed
          
          // Check if we have transcript content
          const transcript = part.transcript || part.text || part.content;
          if (transcript && transcript.trim()) {
            return `${transcript}\n\n[Transcript]`;
          }
          
          // No transcript available
          return '\n\n[Voice/Audio Content]';
        }
        
        // Don't assume unknown objects are voice content
        return '\n\n[Unknown Content]';
      }
    }
    return '';
  });
  
  // Join and clean up the content
  const result = processedParts.join('').trim();
  
  // Clean up multiple newlines and empty content
  return result.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
}

/**
 * Checks if a message contains voice/audio content based on metadata and structure
 * @param {any} messageData The message data object
 * @returns {boolean} True if this is a voice message
 */
function isVoiceMessage(messageData) {
  if (!messageData) return false;
  
  // Primary detection: Check for ChatGPT voice mode metadata
  if (messageData.metadata && messageData.metadata.voice_mode_message === true) {
    return true;
  }
  
  // Secondary detection: Check content type
  if (messageData.content && messageData.content.content_type === 'multimodal_text') {
    // Check if parts contain audio transcription
    if (messageData.content.parts && Array.isArray(messageData.content.parts)) {
      const hasAudioTranscription = messageData.content.parts.some(part => {
        return typeof part === 'object' && part !== null && 
               part.content_type === 'audio_transcription';
      });
      
      if (hasAudioTranscription) return true;
    }
  }
  
  // Legacy detection: Check for older voice metadata patterns
  if (messageData.metadata) {
    if (messageData.metadata.is_voice_message ||
        messageData.metadata.audio_content ||
        messageData.metadata.voice_content ||
        messageData.metadata.transcript) {
      return true;
    }
    
    // Check for voice-related message types (exclude image, file, etc.)
    if (messageData.metadata.message_type === 'voice' ||
        messageData.metadata.message_type === 'audio') {
      return true;
    }
  }
  
  // Legacy content detection
  if (messageData.content) {
    // Check content type (be specific about voice/audio)
    if (messageData.content.content_type === 'voice' ||
        messageData.content.content_type === 'audio') {
      return true;
    }
    
    // Check if parts contain voice objects (not images/files)
    if (messageData.content.parts && Array.isArray(messageData.content.parts)) {
      const hasVoiceObjects = messageData.content.parts.some(part => {
        if (typeof part === 'object' && part !== null) {
          // Only voice-specific properties, not images or files
          return (part.transcript !== undefined || 
                  part.audio !== undefined || 
                  part.voice !== undefined ||
                  part.audio_url !== undefined ||
                  part.voice_message_url !== undefined ||
                  (part.type === 'voice' || part.type === 'audio') ||
                  (part.content_type === 'voice' || part.content_type === 'audio')) &&
                 // Exclude image and file types
                 !(part.type === 'image' || part.content_type === 'image' ||
                   part.type === 'file' || part.content_type === 'file' ||
                   part.document !== undefined || part.image !== undefined ||
                   part.prompt !== undefined || part.size !== undefined);
        }
        return false;
      });
      
      if (hasVoiceObjects) return true;
    }
  }
  
  // Check author metadata for voice mode
  if (messageData.author && messageData.author.metadata) {
    if (messageData.author.metadata.voice_mode || 
        messageData.author.metadata.is_voice_enabled) {
      return true;
    }
  }
  
  return false;
}

/**
 * Checks if a message contains image generation content based on metadata and structure
 * @param {any} messageData The message data object
 * @returns {boolean} True if this is an image generation message
 */
function isImageMessage(messageData) {
  if (!messageData) return false;
  
  // Only check metadata flags
  return Boolean(
    messageData.isImage || // Direct flag
    (messageData.metadata && (
      messageData.metadata.is_image ||
      messageData.metadata.type === 'image' ||
      messageData.metadata.message_type === 'image'
    ))
  );
}

/**
 * Parses a single raw conversation object from the ChatGPT export format.
 * @param {any} convo The raw conversation object.
 * @returns {{ id: string; title: string; create_time: number; messages: { id: string; author: string; content: string; timestamp: number; isVoice?: boolean }[] }} A standardized conversation object.
 */
export function parseConversationObject(convo) {
  const normalizeEpoch = (value) => {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    // ChatGPT export uses seconds; JS Date expects ms.
    return n < 1e12 ? Math.round(n * 1000) : Math.round(n);
  };
  const mapping = convo.mapping;
  const conversationId = convo.id;
  
  if (!mapping) return null;

  const rootMessageNode = Object.values(mapping).find(node => node.parent == null);
  if (!rootMessageNode) return null;

  const messages = [];
  let currentNode = rootMessageNode;
  let hasVoiceContent = false;
  let hasImageContent = false;

  while (currentNode && currentNode.children && currentNode.children.length > 0) {
    const messageData = currentNode.message;

    if (messageData && messageData.author && messageData.author.role !== 'system' && messageData.author.role !== 'tool' && messageData.content && messageData.content.parts) {
      const content = extractContentFromParts(messageData.content.parts);
      const isVoice = isVoiceMessage(messageData);
      
      // Check for image content in the message
      const messageHasImageContent = content && (
        content.includes('[Image Generated:') ||
        content.includes('[Image]') ||
        content.includes('[Image Content]')
      );
      
      // Set image flag based on metadata or content
      const isImage = isImageMessage(messageData) || messageHasImageContent;
      
      // For voice messages, we want to include them even if content is empty/missing
      if (content || isVoice) {
        let finalContent = content;
        
        // If this is a voice message but has no content, add placeholder
        if (isVoice && (!content || content.trim() === '')) {
          finalContent = '[Voice/Audio Content]';
        }
        
        // Create a new metadata object if needed
        let metadata = messageData.metadata || {};
        if (messageHasImageContent) {
          metadata = { ...metadata, is_image: true };
        }
        
        messages.push({
          id: messageData.id,
          author: messageData.author.role,
          content: finalContent,
          timestamp: normalizeEpoch(messageData.create_time),
          metadata: metadata,
          isVoice: isVoice,
          isImage: isImage,
        });
        
        if (isVoice) hasVoiceContent = true;
        if (isImage) hasImageContent = true;
      }
    }
    
    // Find the next message from the main trunk, not side-branches
    const nextNodeId = currentNode.children.find(childId => mapping[childId] && mapping[childId].message);
    currentNode = nextNodeId ? mapping[nextNodeId] : null;
  }
  
  if (messages.length === 0) return null;
  
  return {
    id: conversationId,
    title: convo.title,
    create_time: normalizeEpoch(convo.create_time),
    messages: messages,
    hasVoiceContent: hasVoiceContent,
    hasImageContent: hasImageContent,
  };
}

/**
 * Parses an array of raw conversation objects.
 * @param {any[]} rawConversations The array of raw conversations from the JSON file.
 * @returns {Array} An array of standardized conversation objects.
 */
export function parseConversationObjects(rawConversations) {
  return rawConversations.map(parseConversationObject).filter(Boolean);
} 
