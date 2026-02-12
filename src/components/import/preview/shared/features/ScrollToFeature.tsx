import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ScrollToFeatureProps {
  tagMessageIndex: Record<string, number>;
  conversationId: string;
  messageRefs: Record<string, HTMLElement>;
}

export const ScrollToFeature = ({ tagMessageIndex, conversationId, messageRefs }: ScrollToFeatureProps) => {
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const highlightTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  const scrollToMessage = (messageKey: string, isLastMessage: boolean = false) => {
    const messageElement = messageRefs?.[messageKey];
    if (!messageElement) {
      console.log('No message element found for key:', messageKey);
      return;
    }

    const messagesContainer = messageElement.closest('.messages-scroll-container');
    if (!messagesContainer) {
      console.log('No messages container found, using scrollIntoView');
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Calculate scroll position with adaptive padding
    const containerRect = messagesContainer.getBoundingClientRect();
    const messageRect = messageElement.getBoundingClientRect();
    const messageTopRelativeToContainer = messageRect.top - containerRect.top + messagesContainer.scrollTop;
    
    // Use adaptive padding based on message position
    let topPadding: number;
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
    messageElement.style.boxShadow = isLastMessage 
      ? '0 0 20px rgba(255, 255, 255, 0.8)'
      : '0 0 20px rgba(59, 130, 246, 0.8)';
    messageElement.style.borderColor = isLastMessage
      ? 'rgba(255, 255, 255, 0.8)'
      : 'rgba(59, 130, 246, 0.8)';
    messageElement.style.borderWidth = '2px';
    messageElement.style.transition = 'all 0.3s ease-in-out';

    // Clear highlight after delay
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => {
      messageElement.style.boxShadow = '';
      messageElement.style.borderColor = '';
      messageElement.style.borderWidth = '';
    }, 2000);
  };

  useEffect(() => {
    // When tagMessageIndex changes, scroll to the new message
    const tagKeys = Object.keys(tagMessageIndex).filter(key => 
      key.startsWith(`${conversationId}-`) && !key.endsWith('-indices')
    );
    
    if (tagKeys.length > 0) {
      const latestTagKey = tagKeys[tagKeys.length - 1];
      const currentIndex = tagMessageIndex[latestTagKey];
      const messageIndices = tagMessageIndex[`${latestTagKey}-indices`] as number[] || [];
      
      if (messageIndices.length > 0 && currentIndex >= 0) {
        const messageIndex = messageIndices[currentIndex];
        const messageKey = `${conversationId}-${messageIndex}`;
        
        // Short delay to ensure accordion is open
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          scrollToMessage(messageKey, currentIndex === messageIndices.length - 1);
        }, 200);
      }
    }
  }, [tagMessageIndex, conversationId, messageRefs]);

  return null;
}; 