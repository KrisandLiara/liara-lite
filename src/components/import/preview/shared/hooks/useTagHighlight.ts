import { useState, useRef } from 'react';
import { findCodeBlocks, filterRenderableBlocks } from '@/lib/import/codeDetection';
import { isImageContent } from './useContentDetection';

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
  // Manage transient semantic hint timers so repeated clicks recycle instead of stacking
  const semanticTimers = useRef<WeakMap<HTMLElement, { fade: number; remove: number }>>(new WeakMap());

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

    // debug removed

    // Handle content detection tags differently
    if (tag === 'code') {
      messagesWithTag = conversation.messages
        .map((msg: any, index: number) => ({ msg, index }))
        .filter(({ msg }: { msg: any }) => {
          const content = msg.content;
          if (!content) return false;

          // Convert object content to string
          const text = safeRenderContent(content);
          if (typeof text !== 'string') return false;

          // Use aggressive detection and the same renderability filter as the preview/removal
          const blocks = findCodeBlocks(text, true);
          const filtered = filterRenderableBlocks(text, blocks);

          // Debug logging to show exactly what would be scrolled to
          // debug removed

          // Only scroll to messages that still have renderable code
          return filtered.length > 0;
        });
    } else if (tag === 'image') {
      messagesWithTag = conversation.messages
        .map((msg: any, index: number) => ({ msg, index }))
        .filter(({ msg }: { msg: any }) => isImageContent(msg));
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
    } else if (tag && tag.startsWith('entity::')) {
      const [, category, value] = tag.split('::');
      messagesWithTag = conversation.messages
        .map((msg: any, index: number) => ({ msg, index }))
        .filter(({ msg }: { msg: any }) => Array.isArray(msg?.named_entities?.[category]) && msg.named_entities[category].some((v: string) => v?.toLowerCase() === value?.toLowerCase()));
      (handleTagClick as any)._lastSource = 'ner';
    } else {
      // Handle enriched tags (AI-generated tags)
      messagesWithTag = conversation.messages
        .map((msg: any, index: number) => ({ msg, index }))
        .filter(({ msg }: { msg: any }) => msg.tags && msg.tags.includes(tag));
      (handleTagClick as any)._lastSource = 'tag';
    }

    if (messagesWithTag.length === 0) {
      // debug removed
      return;
    }
    
    // debug removed

    // Get current index for this tag
    const tagKey = `${conversationId}-${tag}`;
    let currentIndex = tagMessageIndex[tagKey];
    
    // Debug logging for cycling
    // debug removed
    
    // If no current index or at the end, start from beginning
    if (currentIndex === undefined || currentIndex >= messagesWithTag.length - 1) {
      currentIndex = -1;
      // debug removed
    }
    
    // Move to next message
    const nextIndex = currentIndex + 1;
    const isLastMessage = nextIndex === messagesWithTag.length - 1;
    const isSingleMessage = messagesWithTag.length === 1;
    
    // debug removed

    // Store both the tag index and the actual message indices we want to cycle through
    setTagMessageIndex(prev => {
      // Check if indices have changed
      const currentIndices = prev[`${tagKey}-indices`];
      const newIndices = messagesWithTag.map(m => m.index);
      const indicesChanged = !currentIndices || 
        currentIndices.length !== newIndices.length ||
        !currentIndices.every((idx, i) => idx === newIndices[i]);
      
      // If indices have changed, reset the index
      const updatedIndex = indicesChanged ? 0 : nextIndex;
      
      // debug removed
      
      return {
        ...prev,
        [tagKey]: updatedIndex,
        [`${tagKey}-indices`]: newIndices
      };
    });

    // Force accordion to open
    setOpenAccordion(conversationId);

    // Get the message to scroll to
    const targetMessage = messagesWithTag[nextIndex];
    const messageKey = `${conversationId}-${targetMessage.index}`;
    
    // Short delay to ensure accordion is open
    setTimeout(() => {
      const messageElement = messageRefs.current[messageKey];
      if (!messageElement) {
        // debug removed
        return;
      }

      // Find the scrollable container
      // Prefer scrolling the nearest messages container so the conversation header remains visible
      const messagesContainer = messageElement.closest('.messages-scroll-container') as HTMLElement | null;
      if (messagesContainer) {
        const containerRect = messagesContainer.getBoundingClientRect();
        const messageRect = messageElement.getBoundingClientRect();
        const messageTopRelativeToContainer = messageRect.top - containerRect.top + messagesContainer.scrollTop;
        const topPadding = 12; // keep small gap so header stays visible
        const scrollTop = Math.max(0, messageTopRelativeToContainer - topPadding);
        messagesContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
      } else {
        // Fallback to native behavior
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

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

      // If the tag is an enriched tag (not code/image/voice) and not a literal text match, show a transient "close match" badge
      try {
        const text = safeRenderContent(targetMessage.msg?.content);
        const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const normalized = typeof text === 'string' ? text.normalize('NFKD') : '';
        const isLiteral = typeof text === 'string' && (new RegExp(`(^|[^A-Za-z0-9_])${escapeRegExp(tag)}(?=$|[^A-Za-z0-9_])`, 'i').test(normalized));
        const sourceType = (handleTagClick as any)._lastSource;
        if (!['image','voice','code'].includes(tag)) {
          // If an inline highlight already exists for this tag/entity in the message, skip fallback badge
          const lower = (tag.startsWith('entity::') ? tag.split('::')[2] : tag)?.toLowerCase();
          const hasInlineHighlight = !!Array.from(messageElement.querySelectorAll('span'))
            .find((el: Element) => el.textContent?.toLowerCase() === lower && el.className.includes('relative group'));
          if (hasInlineHighlight) {
            return; // already highlighted; no fallback badge
          }
          if (isLiteral) {
            return; // literal matched; highlight should be present
          }
          // Prefer placing badge inline next to the author label in the message header
          const headerLabel = messageElement.querySelector('div.mb-3 p');
          const attachTarget = headerLabel?.parentElement || messageElement;
          // Reuse single hint if one exists, otherwise create it
          let hint = attachTarget.querySelector('.liara-semantic-hint') as HTMLElement | null;
          if (!hint) {
            hint = document.createElement('span');
            hint.textContent = sourceType === 'ner' ? 'close match' : 'semantic';
            hint.className = 'liara-semantic-hint ml-2 align-middle inline-block text-[11px] px-2 py-0.5 rounded border bg-yellow-900/30 border-yellow-600/40 text-yellow-200 opacity-0 transition-opacity duration-300';
            attachTarget.appendChild(hint);
          }
          // Cancel previous timers if any and show again
          const timers = semanticTimers.current.get(attachTarget);
          if (timers) {
            clearTimeout(timers.fade);
            clearTimeout(timers.remove);
          }
          requestAnimationFrame(() => { if (hint) hint.style.opacity = '1'; });
          const fade = window.setTimeout(() => { if (hint) hint.style.opacity = '0'; }, 1800);
          const remove = window.setTimeout(() => {
            if (hint && hint.parentElement) hint.parentElement.removeChild(hint);
          }, 2200);
          semanticTimers.current.set(attachTarget, { fade, remove });
        }
      } catch {}
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