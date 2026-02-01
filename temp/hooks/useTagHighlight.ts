import { useState, useRef } from 'react';

// Helper function to safely render content
const safeRenderContent = (content: any) => {
  if (typeof content === 'string') {
    return content;
  } else if (typeof content === 'object' && content !== null) {
    // Handle object content - likely voice conversation data
    return JSON.stringify(content, null, 2);
  } else {
    return String(content || '');
  }
};

export const useTagHighlight = () => {
  const [tagMessageIndex, setTagMessageIndex] = useState<Record<string, number>>({});
  const [openAccordion, setOpenAccordion] = useState('');
  const messageRefs = useRef<Record<string, HTMLElement>>({});

  const setMessageRef = (conversationId: string, messageIndex: number, element: HTMLElement | null) => {
    const key = `${conversationId}-${messageIndex}`;
    if (element) {
      messageRefs.current[key] = element;
    } else {
      delete messageRefs.current[key];
    }
  };

  const handleTagClick = (tag: string, conversationId: string, event: React.MouseEvent, conversations: any[]) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
    }
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation || !conversation.messages) {
      return;
    }

    let messagesWithTag: Array<{ msg: any; index: number }>;

    // Handle content detection tags differently
    if (tag === 'code') {
      messagesWithTag = conversation.messages
        .map((msg: any, index: number) => ({ msg, index }))
        .filter(({ msg }: { msg: any }) => {
          const content = safeRenderContent(msg.content);
          const hasCode = /```/.test(content) || (typeof content === 'string' && content.includes('[Code Block Removed]'));
          return hasCode;
        });
    } else if (tag === 'image') {
      messagesWithTag = conversation.messages
        .map((msg: any, index: number) => ({ msg, index }))
        .filter(({ msg }: { msg: any }) => {
          const hasImage = msg.isImage || (typeof msg.content === 'string' && (
            msg.content.includes('[Image Generated:') || 
            msg.content.includes('[Image]') || 
            msg.content.includes('[Image Content]') ||
            msg.content.includes('"prompt":') || 
            msg.content.includes('"size":') || 
            msg.content.includes('1024x1024') ||
            msg.content.includes('512x512')
          ));
          return hasImage;
        });
    } else if (tag === 'voice') {
      messagesWithTag = conversation.messages
        .map((msg: any, index: number) => ({ msg, index }))
        .filter(({ msg }: { msg: any }) => {
          const hasVoice = msg.isVoice || (typeof msg.content === 'string' && (
            msg.content.includes('[Voice/Audio Content]') ||
            msg.content.includes('[Unknown Content]') ||
            msg.content.includes('[Transcript]')
          ));
          return hasVoice;
        });
    } else {
      // Handle enriched tags (AI-generated tags)
      messagesWithTag = conversation.messages
        .map((msg: any, index: number) => ({ msg, index }))
        .filter(({ msg }: { msg: any }) => msg.tags && msg.tags.includes(tag));
    }

    if (messagesWithTag.length === 0) {
      return;
    }

    // Get current index for this tag
    const tagKey = `${conversationId}-${tag}`;
    let currentIndex = tagMessageIndex[tagKey];
    
    // If no current index or at the end, start from beginning
    if (currentIndex === undefined || currentIndex >= messagesWithTag.length - 1) {
      currentIndex = -1;
    }
    
    // Move to next message
    const nextIndex = currentIndex + 1;
    const isLastMessage = nextIndex === messagesWithTag.length - 1;
    const isSingleMessage = messagesWithTag.length === 1;

    // Store both the tag index and the actual message indices we want to cycle through
    setTagMessageIndex(prev => ({
      ...prev,
      [tagKey]: nextIndex,
      [`${tagKey}-indices`]: messagesWithTag.map(m => m.index) // Store the actual message indices
    }));

    // Force accordion to open
    setOpenAccordion(conversationId);

    // Get the message to scroll to
    const targetMessage = messagesWithTag[nextIndex];
    const messageKey = `${conversationId}-${targetMessage.index}`;
    
    // Short delay to ensure accordion is open
    setTimeout(() => {
      const messageElement = messageRefs.current[messageKey];
      if (!messageElement) {
        console.log('Message element not found for key:', messageKey);
        return;
      }

      // Find the scrollable container
      const messagesContainer = messageElement.closest('.messages-scroll-container');
      if (!messagesContainer) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // Calculate scroll position with adaptive padding
      const containerRect = messagesContainer.getBoundingClientRect();
      const messageRect = messageElement.getBoundingClientRect();
      const messageTopRelativeToContainer = messageRect.top - containerRect.top + messagesContainer.scrollTop;
      
      // Use adaptive padding based on message position
      let topPadding;
      if (messageTopRelativeToContainer < 120) {
        topPadding = Math.max(0, Math.min(10, messageTopRelativeToContainer / 2));
      } else if (messageTopRelativeToContainer < 200) {
        topPadding = Math.max(0, Math.min(25, messageTopRelativeToContainer - 15));
      } else {
        topPadding = Math.min(40, Math.max(0, messageTopRelativeToContainer - 10));
      }
      
      const scrollTop = Math.max(0, messageTopRelativeToContainer - topPadding);
      
      // Scroll with smooth behavior
      messagesContainer.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });

      // Add highlight effect
      messageElement.style.transition = 'all 0.3s ease-in-out';
      
      // If this is the last message or the only message, highlight it in white
      if (isLastMessage || isSingleMessage) {
        messageElement.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
        messageElement.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        messageElement.style.borderWidth = '2px';
        
        // If it's the last message (and not a single message), reset index after delay
        if (isLastMessage && !isSingleMessage) {
          setTimeout(() => {
            // Reset index to -1 so next click goes to first message (index 0)
            setTagMessageIndex(prev => ({
              ...prev,
              [tagKey]: -1
            }));
            
            // Keep the white highlight for a moment before fading
            setTimeout(() => {
              if (messageElement) {
                messageElement.style.boxShadow = '';
                messageElement.style.borderColor = '';
                messageElement.style.borderWidth = '';
              }
            }, 1500); // Keep white highlight visible for 1.5s
          }, 500); // Wait 0.5s before resetting index
        } else {
          // For single messages, just clear the highlight after delay
          setTimeout(() => {
            messageElement.style.boxShadow = '';
            messageElement.style.borderColor = '';
            messageElement.style.borderWidth = '';
          }, 2000);
        }
      } else {
        // Regular blue highlight for non-last messages
        messageElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8)';
        messageElement.style.borderColor = 'rgba(59, 130, 246, 0.8)';
        messageElement.style.borderWidth = '2px';
        
        // Clear highlight after delay
        setTimeout(() => {
          messageElement.style.boxShadow = '';
          messageElement.style.borderColor = '';
          messageElement.style.borderWidth = '';
        }, 2000);
      }
    }, 200);
  };

  return {
    tagMessageIndex,
    openAccordion,
    setOpenAccordion,
    handleTagClick,
    setMessageRef,
    messageRefs: messageRefs.current // Return messageRefs.current instead of the ref object
  };
}; 