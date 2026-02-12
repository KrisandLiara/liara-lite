import { removeCode } from './codeDetection';

function removeCodeBlocks(content) {
  if (typeof content !== 'string') return content;
  // First pass (conservative but aggressive detection)
  let result = removeCode(content);
  // Second pass: sometimes after replacing with placeholders, adjacent fragments
  // become detectable as renderable blocks (e.g., split logs). One more pass is cheap
  // and safe because placeholders are ignored by the detector.
  result = removeCode(result);
  // debug removed
  return result;
}

/**
 * Preprocesses a single conversation.
 * @param {object} convo The conversation object.
 * @param {object} config Configuration options.
 * @param {boolean} config.removeCodeBlocks Whether to remove code blocks.
 * @param {boolean} config.showAI Whether to include AI/assistant messages.
 * @param {boolean} config.showUser Whether to include user messages.
 * @returns {object} The preprocessed conversation.
 */
function preprocessConversation(convo, config) {
  // Filter messages by author if specified
  if (!config.showAI || !config.showUser) {
    convo.messages = convo.messages.filter(message => {
      const isAI = message.role === 'assistant' || message.role === 'ai';
      const isUser = message.role === 'user';
      
      if (isAI && !config.showAI) return false;
      if (isUser && !config.showUser) return false;
      
      return true;
    });
  }

  // Remove code blocks if specified
  if (config.removeCodeBlocks) {
    convo.messages = convo.messages.map(message => ({
      ...message,
      content: removeCodeBlocks(message.content),
    }));
  }
  
  return convo;
}

/**
 * Preprocesses an array of conversations.
 * @param {Array<object>} conversations The array of conversations.
 * @param {object} config Configuration options.
 * @returns {Array<object>} The array of preprocessed conversations.
 */
export function preprocessConversations(conversations, config) {
  return conversations.map(convo => preprocessConversation(convo, config));
} 