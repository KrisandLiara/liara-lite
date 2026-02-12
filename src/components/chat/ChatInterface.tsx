import React, { useState, useCallback, useEffect, useRef } from "react";
import { ChatHeader } from "./ChatHeader.tsx";
import { ChatInputBar } from "./ChatInputBar.tsx";
import { MessageList } from "./MessageList.tsx";
import { useMemory } from "@/contexts/MemoryContext";
import { useAuth } from "@/contexts/AuthContext";
import { MemoryEntry } from "@/lib/memory/types";
import { Message as DisplayMessage } from "./types.ts";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import { useNotifications } from "@/contexts/NotificationContext";

export const ChatInterface: React.FC<{ isGuest?: boolean }> = ({ isGuest = false }) => {
  const {
    messages,
    setMessages,
    currentConversationTitle,
    setCurrentConversationTitle,
    loadedConversationTitle,
    setLoadedConversationTitle,
    loadedConversationMessages,
    setLoadedConversationMessages,
    loadConversation,
    clearLoadedConversation,
    isLoading: contextIsLoading,
    fetchRecentConversations,
    searchType,
    activeConversationId,
    setActiveConversationId,
    renameConversation,
    useLongTermMemory,
    setUseLongTermMemory,
    refreshRecentConversations,
    generateDetails,
    isGeneratingDetails,
    generatedDetails,
    setGeneratedDetails
  } = useMemory();

  const { session, user } = useAuth();
  const { addNotification } = useNotifications();
  const [isSending, setIsSending] = useState(false);

  const [currentGuestSessionId, setCurrentGuestSessionId] = useState<string | null>(null);
  const [guestDisplayMessages, setGuestDisplayMessages] = useState<DisplayMessage[]>([]);

  console.log('[ChatInterface Render] Context Is Loading:', contextIsLoading);
  console.log('[ChatInterface Render] Active Conversation ID:', activeConversationId);
  console.log('[ChatInterface Render] Loaded Conversation Messages:', loadedConversationMessages);
  console.log('[ChatInterface Render] New Chat Messages:', messages);

  const effectiveMessagesToDisplay: MemoryEntry[] = (activeConversationId ? loadedConversationMessages : messages) || [];
  const displayTitle = isGuest ? "Guest Chat" : (loadedConversationTitle || currentConversationTitle || "New Chat");

  console.log('[ChatInterface Render] Effective Messages to Display:', effectiveMessagesToDisplay);

  const authMessagesForList: DisplayMessage[] = effectiveMessagesToDisplay.map(mem => ({
    id: mem.id,
    content: mem.content,
    sender: (mem.role === 'user') ? 'user' : 'assistant',
    timestamp: new Date(mem.created_at || mem.timestamp),
  }));

  const messagesForList: DisplayMessage[] = isGuest ? guestDisplayMessages : authMessagesForList;

  console.log('[ChatInterface Render] Final Messages for List:', messagesForList);

  const handleNewChat = () => {
    if (isGuest) return;
    console.log('[ChatInterface] handleNewChat called.');
    clearLoadedConversation();
    setCurrentConversationTitle(null);
    setMessages([]);
    setActiveConversationId(null);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userId = user?.id;
    if (!userId) {
      console.error('Send Error: User is not authenticated.');
      return;
    }

    setIsSending(true);
    const optimisticId = crypto.randomUUID();

    const userMessage: MemoryEntry = {
      id: optimisticId,
      content: text,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      user_id: userId,
    };

    if (activeConversationId) {
      setLoadedConversationMessages(prev => [...prev, userMessage]);
    } else {
      setMessages(prev => [...prev, userMessage]);
    }

    try {
      const token = session?.access_token;
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          message: text,
          conversationId: activeConversationId,
          useLongTermMemory: useLongTermMemory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to process chat turn.' }));
        throw new Error(errorData.message || 'The server returned an error.');
      }

      const result = await response.json();
      const { user_message: savedUserMessage, ai_message: savedAiMessage, new_session_info } = result;
      
      const updateStateWithFinalMessages = (prev: MemoryEntry[]) => {
        const withoutOptimistic = prev.filter(m => m.id !== optimisticId);
        return [...withoutOptimistic, savedUserMessage, savedAiMessage];
      };
      
      if (activeConversationId) {
        setLoadedConversationMessages(updateStateWithFinalMessages);
      } else if (new_session_info) {
        setActiveConversationId(new_session_info.id);
        setLoadedConversationTitle(new_session_info.title);
        setLoadedConversationMessages(updateStateWithFinalMessages(messages));
        setMessages([]);
        refreshRecentConversations();
      }

    } catch (error: any) {
      console.error('Send Error', error.message);
      addNotification('Failed to send message', 'error');
      const updater = (prev: MemoryEntry[]) => prev.filter(m => m.id !== optimisticId);
      if (activeConversationId) {
        setLoadedConversationMessages(updater);
      } else {
        setMessages(updater);
      }
    } finally {
      setIsSending(false);
    }
  };
  
  useEffect(() => {
    if (activeConversationId) {
      loadConversation(activeConversationId);
    }
  }, [activeConversationId, loadConversation]);

  useEffect(() => {
    if (loadedConversationTitle) {
      setMessages([]);
      setCurrentConversationTitle(null);
    }
  }, [loadedConversationTitle, setMessages, setCurrentConversationTitle]);

  useEffect(() => {
    if (isGuest) {
      console.log('Guest Mode Init: ChatInterface is in guest mode.');
      const initializeGuestSession = async () => {
        let guestId = localStorage.getItem('guestSessionToken');
        if (guestId) {
          console.log(`Guest Session Resume: Found token: ${guestId}`);
          setCurrentGuestSessionId(guestId);
          try {
            const { data, error } = await supabase
              .from('chat_messages')
              .select('id, content, role, created_at')
              .eq('guest_session_id', guestId)
              .order('created_at', { ascending: true });

            if (error) throw error;

            if (data) {
              const loadedGuestMessages: DisplayMessage[] = data.map(record => ({
                id: record.id,
                content: record.content,
                sender: record.role === 'user' ? 'user' : 'assistant',
                timestamp: new Date(record.created_at),
              }));
              setGuestDisplayMessages(loadedGuestMessages);
              console.log(`Guest History Loaded: Loaded ${loadedGuestMessages.length} messages.`);
            }
          } catch (error: any) {
            console.error("Error loading guest chat history:", error);
          }
        } else {
          guestId = uuidv4();
          localStorage.setItem('guestSessionToken', guestId);
          setCurrentGuestSessionId(guestId);
          console.log(`Guest Session New: Generated new token: ${guestId}`);
          try {
            const { error: guestSessionError } = await supabase
              .from('guest_sessions')
              .insert({ id: guestId, session_token: guestId, last_active: new Date().toISOString() });
            if (guestSessionError) throw guestSessionError;
            console.log(`Guest Session Stored: Session ${guestId} saved to guest_sessions.`);
          } catch (error: any) {
            console.error("Error creating guest session in DB:", error);
          }
        }
      };
      initializeGuestSession();
    } else {
      setCurrentGuestSessionId(null);
      setGuestDisplayMessages([]);
      console.log('Guest Mode Exit: ChatInterface is in authenticated mode.');
    }
  }, [isGuest]);

  useEffect(() => {
    console.log('API Connected: Supabase connection successful.');
    const currentChatMode = isGuest ? "guest_mode" : (user ? searchType : "auth_pending_or_unknown");
    console.log('Chat Mode: Current mode:', currentChatMode);
  }, [user, isGuest, searchType]);

  const handleRenameTitle = (newTitle: string) => {
    if (activeConversationId && newTitle.trim()) {
      console.log('Attempting Rename: ID:', activeConversationId, 'New Title:', newTitle);
      renameConversation(activeConversationId, newTitle.trim());
    } else {
      console.log('Rename Aborted: No active conversation ID or title is empty.');
    }
  };
  
  const handleGenerateDetails = async () => {
    if (!activeConversationId) {
        console.log('Generate Details Aborted: No active conversation.');
        addNotification("No active conversation selected", "warning");
        return;
    }
    console.log('Generate Details Clicked for session:', activeConversationId);
    generateDetails(activeConversationId);
  };

  useEffect(() => {
    if (!activeConversationId || !user) {
      setGeneratedDetails(null);
      return;
    }

    const fetchDetails = async () => {
      console.log('Fetching Details: Checking for generated details for session', activeConversationId);
      
      const { data, error } = await supabase
        .from('memories')
        .select('metadata')
        .eq('type', 'conversation_details')
        .eq('user_id', user.id)
        .eq('source', activeConversationId)
        .limit(1);
      
      if (error) {
        console.error("Error fetching conversation details from memory:", error);
        setGeneratedDetails(null);
      } else if (data && data.length > 0 && data[0].metadata) {
        const { topic, tags } = data[0].metadata as { topic: string, tags: string[] };
        setGeneratedDetails({ topic, tags });
        console.log('Details Found: Loaded topic', topic, 'for session', activeConversationId);
      } else {
        setGeneratedDetails(null);
        console.log('No Details Found: No pre-generated details for session', activeConversationId);
      }
    };

    fetchDetails();
  }, [activeConversationId, user, supabase]);
  
  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
        <ChatHeader
            title={displayTitle}
            onNewChat={handleNewChat}
            isGuest={isGuest}
            onRename={handleRenameTitle}
            onGenerateDetails={handleGenerateDetails}
            isGeneratingDetails={isGeneratingDetails}
            generatedDetails={generatedDetails}
            useLongTermMemory={useLongTermMemory}
            setUseLongTermMemory={setUseLongTermMemory}
            activeConversationId={activeConversationId}
        />
        <MessageList 
          messages={messagesForList} 
          isLoading={contextIsLoading || isSending} 
        />
        <ChatInputBar 
          onSend={handleSendMessage} 
          isLoading={contextIsLoading || isSending} 
          isGuest={isGuest}
        />
    </div>
  );
};

export default ChatInterface;
