const CODE_BLOCK_REGEX = /```[\s\S]*?```/g;

/**
 * Removes markdown code blocks from a string.
 * @param {string} content The string content.
 * @returns {string} Content with code blocks removed.
 */
function removeCodeBlocks(content) {
  if (typeof content !== 'string') {
    return '';
  }
  return content.replace(/```[\s\S]*?```/g, '');
}

/**
 * Cleans and preprocesses a single message.
 * @param {object} message The message to preprocess.
 * @param {object} config The configuration for preprocessing.
 * @returns {object} The preprocessed message.
 */
function preprocessMessage(message, config) {
  let content = message.content;
  
  if (config.removeCodeBlocks) {
    content = removeCodeBlocks(content);
  }

  content = content.replace(/\s+/g, ' ').trim();
  return { ...message, content };
}

/**
 * Applies preprocessing steps to a list of conversations.
 * @param {Array<object>} conversations The array of parsed conversation objects.
 * @param {object} config Configuration for preprocessing.
 * @param {boolean} config.removeCodeBlocks Whether to remove code blocks.
 * @returns {Array<object>} The preprocessed conversations.
 */
export function preprocessConversations(conversations, config) {
  let processed = [...conversations];

  if (config.removeCodeBlocks) {
    processed = processed.map(convo => ({
      ...convo,
      messages: convo.messages.map(msg => ({
        ...msg,
        content: msg.content.replace(CODE_BLOCK_REGEX, ''),
      })),
    }));
  }
  
  // Filter out messages that are now empty
  processed = processed.map(convo => ({
    ...convo,
    messages: convo.messages.filter(msg => msg.content.trim() !== ''),
  }));

  // Filter out conversations that now have no messages
  processed = processed.filter(convo => convo.messages.length > 0);
  
  return processed;
} 