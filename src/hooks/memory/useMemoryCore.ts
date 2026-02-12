import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast"
import { Json } from '@/lib/types/database';
import { useSettings } from '@/contexts/SettingsContext';

export type Memory = {
  id: string;
  created_at: string;
  user_id: string;
  content: string;
  embedding?: number[];
  metadata: Json;
  role?: 'user' | 'assistant' | 'system';
  source_id?: string;
  timestamp?: string;
};

export type Tag = {
  name: string;
  id: string;
  count?: number;
};

type GeneratedDetails = {
  topic: string;
  tags: string[];
};

export function useMemoryCore() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { isTestMode } = useSettings();
  const memoriesTable = isTestMode ? 'test_memories' : 'memories';

  const [memories, setMemories] = useState<Memory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState<boolean>(false);
  const [generatedDetails, setGeneratedDetails] = useState<GeneratedDetails | null>(null);

  const [messages, setMessages] = useState<Memory[]>([]);
  const [currentConversationTitle, setCurrentConversationTitle] = useState<string | null>(null);
  const [loadedConversationTitle, setLoadedConversationTitle] = useState<string | null>(null);
  const [loadedConversationMessages, setLoadedConversationMessages] = useState<Memory[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    if (!session) {
      setMemories([]);
      setTags([]);
      return;
    };
    try {
      setIsLoading(true);
      const [memoriesRes, tagsRes] = await Promise.all([
        supabase.from(memoriesTable).select(
          'id, created_at, user_id, content, role, source, timestamp, summary, tags, metadata, conversation_start_time, conversation_title, source_chat_id'
        ).order('created_at', { ascending: false }),
        supabase.rpc('get_distinct_tags_with_counts', { 
            p_user_id: session.user.id,
            p_table_name: memoriesTable 
        })
      ]);

      if (memoriesRes.error) throw memoriesRes.error;
      if (tagsRes.error) throw tagsRes.error;

      setMemories(memoriesRes.data || []);
      const distinctTags: Tag[] = tagsRes.data?.map((t: any) => ({ name: t.tag, id: t.tag, count: t.count })) || [];
      setTags(distinctTags);
    } catch (error: any) {
      toast({ title: "Error fetching initial data", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast, memoriesTable]);

  useEffect(() => {
    if (session) {
      fetchInitialData();
    }
  }, [session, fetchInitialData]);

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!session) return;
    setIsLoading(true);
    try {
        const { data: messagesData, error: messagesError } = await supabase
            .from(memoriesTable)
            .select('*')
            .eq('user_id', session.user.id)
            .eq('source', conversationId)
            .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        const { data: sessionData, error: sessionError } = await supabase
            .from('chat_sessions')
            .select('title')
            .eq('id', conversationId)
            .single();

        if (sessionError) throw sessionError;

        setLoadedConversationMessages(messagesData || []);
        setLoadedConversationTitle(sessionData?.title || 'Untitled Conversation');
        setActiveConversationId(conversationId);
        setMessages([]);
        setCurrentConversationTitle(null);

    } catch (error: any) {
        console.error('[useMemoryCore] Error in loadConversation:', error);
        toast({ title: "Error loading conversation", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [session, toast, memoriesTable]);

  const clearLoadedConversation = useCallback(() => {
    setLoadedConversationMessages([]);
    setLoadedConversationTitle(null);
    setActiveConversationId(null);
  }, []);

  const generateDetails = useCallback(async (conversationId: string) => {
    if (!session?.user?.id || !conversationId) {
      toast({ title: "Error", description: "Conversation ID or User ID is missing.", variant: "destructive" });
      return null;
    }
    setIsGeneratingDetails(true);
    setGeneratedDetails(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-conversation-details', {
        body: { conversationId, userId: session.user.id },
      });

      if (error) throw new Error(`Function invocation failed: ${error.message}`);
      if (!data) throw new Error("No data returned from function.");
      
      const details = { topic: data.topic, tags: data.tags };
      setGeneratedDetails(details);
      toast({ title: "Generated Details", description: `Topic: ${data.topic}` });
      return details;
    } catch (error: any) {
      console.error("Error generating details:", error);
      toast({ title: "Error generating details", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setIsGeneratingDetails(false);
    }
  }, [session, toast]);

  return useMemo(() => ({
    memories,
    tags,
    isLoading,
    fetchInitialData,
    isGeneratingDetails,
    generatedDetails,
    generateDetails,
    setMemories, 
    setTags,
    setGeneratedDetails,
    messages,
    setMessages,
    currentConversationTitle,
    setCurrentConversationTitle,
    loadedConversationTitle,
    setLoadedConversationTitle,
    loadedConversationMessages,
    setLoadedConversationMessages,
    activeConversationId,
    setActiveConversationId,
    loadConversation,
    clearLoadedConversation
  }), [
    memories, tags, isLoading, fetchInitialData, isGeneratingDetails, generatedDetails,
    generateDetails, messages, currentConversationTitle, loadedConversationTitle,
    loadedConversationMessages, activeConversationId, loadConversation, clearLoadedConversation
  ]);
} 