import { v4 as uuidv4 } from 'uuid';

/**
 * Parses a single raw conversation object from the ChatGPT export format.
 * @param {any} convo The raw conversation object.
 * @returns {{ id: string; title: string; create_time: number; messages: { id: string; role: string; content: string; timestamp: number }[] }} A standardized conversation object.
 */
function parseConversationObject(convo) {
  const mapping = convo.mapping;
  const conversationId = convo.id;
  
  if (!mapping) return null;

  const rootMessageNode = Object.values(mapping).find(node => node.parent == null);
  if (!rootMessageNode) return null;

  const messages = [];
  let currentNode = rootMessageNode;

  while (currentNode && currentNode.children && currentNode.children.length > 0) {
    const messageData = currentNode.message;

    if (messageData && messageData.author && messageData.author.role !== 'system' && messageData.content && messageData.content.parts) {
      const content = messageData.content.parts.join('');
      if (content) {
        messages.push({
          id: messageData.id,
          author: messageData.author.role,
          content: content,
          timestamp: messageData.create_time,
        });
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
    create_time: convo.create_time,
    messages: messages,
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